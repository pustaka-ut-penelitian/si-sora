from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, String, or_
from app.db.session import get_db
from app.models.models import RawComment, AIAnalysis, User, GeneratedInsight, GeneratedWordCloud
from app.services.ai_engine import analyze_comment
from app.api.auth import get_current_user, require_admin_role
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str
    source: str = "manual"

@router.post("/analyze")
async def analyze_and_store(
    request: AnalyzeRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        ai_result = await analyze_comment(request.text)
        
        from datetime import datetime, timezone
        new_comment = RawComment(
            text_content=request.text,
            platform=request.source,
            source_url="api",
            posted_at=datetime.now(timezone.utc),
            status="PROCESSED"
        )
        db.add(new_comment)
        await db.flush()
        
        new_analysis = AIAnalysis(
            comment_id=new_comment.id,
            sentiment=ai_result.sentiment,
            emotion=ai_result.emotion,
            topic_tags=ai_result.topic_tags,
            ai_reasoning=ai_result.ai_reasoning
        )
        db.add(new_analysis)
        await db.commit()
        
        return {
            "status": "success",
            "data": {
                "comment_id": new_comment.id,
                "analysis": ai_result.dict()
            }
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class ScrapeRequest(BaseModel):
    source: str
    target_id: str
    limit: int = 10

@router.post("/scrape")
async def trigger_scraping(
    request: ScrapeRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_role)
):
    import time
    start_time = time.perf_counter()
    try:
        from app.services.scrapers.pipeline import run_scraping_pipeline
        comments = await run_scraping_pipeline(request.source, request.target_id, request.limit, db)
        elapsed = round(time.perf_counter() - start_time, 2)
        try:
            from app.models.models import ScraperLog
            log_entry = ScraperLog(
                platform=request.source,
                target_id=request.target_id,
                status="BERHASIL",
                comments_count=len(comments),
                execution_time_sec=elapsed,
                error_message=None
            )
            db.add(log_entry)
            await db.commit()
        except Exception:
            pass
        return {
            "status": "success",
            "message": f"Berhasil menarik dan menganalisis {len(comments)} komentar.",
            "data": comments,
            "count": len(comments),
            "execution_time": elapsed
        }
    except Exception as e:
        await db.rollback()
        elapsed = round(time.perf_counter() - start_time, 2)
        try:
            from app.models.models import ScraperLog
            log_entry = ScraperLog(
                platform=request.source,
                target_id=request.target_id,
                status="GAGAL",
                comments_count=0,
                execution_time_sec=elapsed,
                error_message=str(e)[:500]
            )
            db.add(log_entry)
            await db.commit()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/overview")
async def get_stats_overview(db: AsyncSession = Depends(get_db)):
    try:
        total_query = select(func.count(AIAnalysis.id))
        total_result = await db.execute(total_query)
        total_count = total_result.scalar() or 0

        sentiment_query = select(AIAnalysis.sentiment, func.count(AIAnalysis.id)).group_by(AIAnalysis.sentiment)
        sentiment_result = await db.execute(sentiment_query)
        distribution = {row[0].lower(): row[1] for row in sentiment_result.all()}

        pos = distribution.get("positif", 0)
        neg = distribution.get("negatif", 0)
        neu = distribution.get("netral", 0)

        dominant = "netral"
        if pos > neg and pos > neu:
            dominant = "positif"
        elif neg > pos and neg > neu:
            dominant = "negatif"

        latest_query = select(func.max(RawComment.posted_at)).select_from(AIAnalysis).join(RawComment, AIAnalysis.comment_id == RawComment.id)
        latest_result = await db.execute(latest_query)
        latest_date = latest_result.scalar()

        def get_percentage(count, total):
            if total == 0: return "0%"
            return f"{round((count / total) * 100)}%"

        return {
            "status": "success",
            "data": {
                "total_data": total_count,
                "positif_pct": get_percentage(pos, total_count),
                "negatif_pct": get_percentage(neg, total_count),
                "netral_pct": get_percentage(neu, total_count),
                "dominant_sentiment": dominant,
                "last_collected_at": latest_date.isoformat() if latest_date else None,
                "raw_counts": {
                    "positif": pos,
                    "negatif": neg,
                    "netral": neu
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/topics")
async def get_stats_topics(db: AsyncSession = Depends(get_db)):
    try:
        from collections import Counter
        query = select(AIAnalysis.topic_tags)
        result = await db.execute(query)
        tags_rows = result.scalars().all()
        
        counter = Counter()
        for tags in tags_rows:
            if tags:
                for tag in tags:
                    counter[tag.lower().strip()] += 1
                    
        top_topics = [{"name": t[0].title(), "count": t[1]} for t in counter.most_common(7)]
        
        return {
            "status": "success",
            "data": top_topics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from typing import Optional

async def build_and_persist_wordcloud_snapshots(db: AsyncSession, operator_username: str) -> str:
    from app.services.wordcloud_gen import extract_smart_frequencies, generate_wordcloud_base64
    import uuid
    from datetime import datetime, timezone

    query = (
        select(RawComment.text_content, AIAnalysis.sentiment)
        .join(AIAnalysis, RawComment.id == AIAnalysis.comment_id)
    )
    result = await db.execute(query)
    rows = result.all()

    texts_by_sentiment = {
        "all": [],
        "positif": [],
        "negatif": [],
        "netral": []
    }

    for text, sentiment in rows:
        if not text:
            continue
        texts_by_sentiment["all"].append(text)
        sent_key = (sentiment or "").strip().lower()
        if sent_key in texts_by_sentiment:
            texts_by_sentiment[sent_key].append(text)

    snapshot_id = uuid.uuid4()
    total_comments = len(texts_by_sentiment["all"])
    current_time = datetime.now(timezone.utc)

    for sentiment_key, texts_list in texts_by_sentiment.items():
        frequencies = extract_smart_frequencies(texts_list, target_word_count=180)
        top_words = sorted(frequencies.keys(), key=lambda w: frequencies[w], reverse=True)[:15]

        for layout_mode in ["desktop", "mobile"]:
            image_b64 = generate_wordcloud_base64(frequencies, sentiment_key, layout_mode)
            wc_record = GeneratedWordCloud(
                snapshot_id=snapshot_id,
                sentiment=sentiment_key,
                layout=layout_mode,
                image_data=image_b64,
                top_words=top_words,
                total_comments=total_comments,
                created_at=current_time,
                created_by=operator_username
            )
            db.add(wc_record)

    await db.commit()
    return snapshot_id

@router.get("/stats/wordcloud")
async def get_wordcloud(
    sentiment: Optional[str] = "all",
    layout: Optional[str] = "desktop", 
    db: AsyncSession = Depends(get_db)
):
    try:
        target_sentiment = sentiment.lower() if sentiment else "all"
        target_layout = layout.lower() if layout else "desktop"

        query = (
            select(GeneratedWordCloud)
            .where(
                GeneratedWordCloud.sentiment == target_sentiment,
                GeneratedWordCloud.layout == target_layout
            )
            .order_by(GeneratedWordCloud.created_at.desc())
            .limit(1)
        )
        result = await db.execute(query)
        latest_record = result.scalars().first()

        if not latest_record:
            snapshot_id = await build_and_persist_wordcloud_snapshots(db, operator_username="Sistem (Inisialisasi Otomatis)")
            query_new = (
                select(GeneratedWordCloud)
                .where(
                    GeneratedWordCloud.sentiment == target_sentiment,
                    GeneratedWordCloud.layout == target_layout,
                    GeneratedWordCloud.snapshot_id == snapshot_id
                )
                .limit(1)
            )
            result_new = await db.execute(query_new)
            latest_record = result_new.scalars().first()

        if not latest_record:
            raise HTTPException(status_code=404, detail="Word cloud data tidak ditemukan.")

        return {
            "status": "success",
            "data": {
                "sentiment": latest_record.sentiment,
                "layout": latest_record.layout,
                "image": latest_record.image_data,
                "snapshot_id": str(latest_record.snapshot_id),
                "total_comments": latest_record.total_comments,
                "top_words": latest_record.top_words or [],
                "created_at": latest_record.created_at.isoformat() if latest_record.created_at else None,
                "created_by": latest_record.created_by
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stats/wordcloud/generate")
async def regenerate_wordclouds(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_role)
):
    try:
        snapshot_id = await build_and_persist_wordcloud_snapshots(
            db, 
            operator_username=current_user.username or current_user.email or "Admin"
        )
        query = (
            select(GeneratedWordCloud)
            .where(
                GeneratedWordCloud.snapshot_id == snapshot_id,
                GeneratedWordCloud.sentiment == "all",
                GeneratedWordCloud.layout == "desktop"
            )
            .limit(1)
        )
        result = await db.execute(query)
        record = result.scalars().first()

        return {
            "status": "success",
            "message": "Word cloud berhasil dipindai dan dibentuk ulang dari seluruh data riil.",
            "data": {
                "snapshot_id": str(snapshot_id),
                "total_comments": record.total_comments if record else 0,
                "top_words": record.top_words if record else [],
                "created_at": record.created_at.isoformat() if record and record.created_at else None,
                "created_by": record.created_by if record else current_user.username
            }
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/wordcloud/history")
async def get_wordcloud_history(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    try:
        query = (
            select(
                GeneratedWordCloud.snapshot_id,
                GeneratedWordCloud.total_comments,
                GeneratedWordCloud.created_by,
                GeneratedWordCloud.created_at,
                GeneratedWordCloud.top_words
            )
            .where(
                GeneratedWordCloud.sentiment == "all",
                GeneratedWordCloud.layout == "desktop"
            )
            .order_by(GeneratedWordCloud.created_at.desc())
            .limit(limit)
        )
        result = await db.execute(query)
        rows = result.all()
        history = [
            {
                "snapshot_id": str(row.snapshot_id),
                "total_comments": row.total_comments,
                "created_by": row.created_by,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "top_words": row.top_words or []
            }
            for row in rows
        ]
        return {
            "status": "success",
            "data": history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/trend")
async def get_stats_trend(db: AsyncSession = Depends(get_db)):
    try:
        query = select(func.date(AIAnalysis.analyzed_at).label('date'), AIAnalysis.sentiment, func.count(AIAnalysis.id))\
            .group_by(func.date(AIAnalysis.analyzed_at), AIAnalysis.sentiment)\
            .order_by(func.date(AIAnalysis.analyzed_at))
        result = await db.execute(query)
        rows = result.all()
        
        from collections import defaultdict
        trend_dict = defaultdict(lambda: {"positif": 0, "negatif": 0, "netral": 0})
        for r in rows:
            if r[0]:
                date_str = r[0].isoformat()
                trend_dict[date_str][r[1].lower()] = r[2]
                
        trend_list = []
        for d, counts in sorted(trend_dict.items()):
            trend_list.append({
                "date": d,
                "positif": counts["positif"],
                "negatif": counts["negatif"],
                "netral": counts["netral"]
            })
            
        return {
            "status": "success",
            "data": trend_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/platform")
async def get_stats_platform(db: AsyncSession = Depends(get_db)):
    try:
        from app.models.models import RawComment
        query = select(RawComment.platform, AIAnalysis.sentiment, func.count(AIAnalysis.id))\
            .join(AIAnalysis, RawComment.id == AIAnalysis.comment_id)\
            .group_by(RawComment.platform, AIAnalysis.sentiment)
        result = await db.execute(query)
        rows = result.all()
        
        from collections import defaultdict
        plat_dict = defaultdict(lambda: {"positif": 0, "negatif": 0, "netral": 0})
        for r in rows:
            plat = r[0].lower().title() if r[0] else "Unknown"
            sent = r[1].lower() if r[1] else "netral"
            plat_dict[plat][sent] = r[2]
            
        plat_list = []
        for p, counts in plat_dict.items():
            plat_list.append({
                "platform": p,
                "positif": counts["positif"],
                "negatif": counts["negatif"],
                "netral": counts["netral"]
            })
            
        return {
            "status": "success",
            "data": plat_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def generate_insight_internal(db: AsyncSession):
    from collections import Counter
    
    async def get_paired_topic_exemplars(sent: str, limit: int = 3):
        q = select(AIAnalysis.topic_tags).where(func.lower(AIAnalysis.sentiment) == sent)
        res = await db.execute(q)
        t_rows = res.scalars().all()
        c = Counter()
        for ts in t_rows:
            if ts:
                for t in ts: c[t.strip()] += 1
        top_topics = c.most_common(limit)
        
        paired_list = []
        for topic_name, count in top_topics:
            q_exemplar = (
                select(
                    RawComment.text_content,
                    RawComment.platform,
                    AIAnalysis.emotion
                )
                .join(AIAnalysis, RawComment.id == AIAnalysis.comment_id)
                .where(func.lower(AIAnalysis.sentiment) == sent)
                .where(AIAnalysis.topic_tags.contains([topic_name]))
                .where(func.length(RawComment.text_content) >= 25)
                .where(func.length(RawComment.text_content) <= 300)
                .order_by(AIAnalysis.analyzed_at.desc())
                .limit(1)
            )
            row = (await db.execute(q_exemplar)).first()
            if not row:
                q_fallback = (
                    select(
                        RawComment.text_content,
                        RawComment.platform,
                        AIAnalysis.emotion
                    )
                    .join(AIAnalysis, RawComment.id == AIAnalysis.comment_id)
                    .where(func.lower(AIAnalysis.sentiment) == sent)
                    .where(AIAnalysis.topic_tags.contains([topic_name]))
                    .order_by(AIAnalysis.analyzed_at.desc())
                    .limit(1)
                )
                row = (await db.execute(q_fallback)).first()

            exemplar_data = None
            if row:
                clean_text = " ".join(row.text_content.strip().replace("", "").split())
                if len(clean_text) > 220:
                    clean_text = clean_text[:217] + "..."
                exemplar_data = {
                    "platform": row.platform or "Publik",
                    "emotion": row.emotion or "netral",
                    "quote": clean_text
                }

            paired_list.append({
                "topic": topic_name,
                "count": count,
                "exemplar": exemplar_data
            })
        return paired_list

    async def get_neutral_suggestions(limit: int = 2):
        q_neu = (
            select(
                RawComment.text_content,
                RawComment.platform,
                AIAnalysis.emotion,
                AIAnalysis.topic_tags
            )
            .join(AIAnalysis, RawComment.id == AIAnalysis.comment_id)
            .where(func.lower(AIAnalysis.sentiment) == "netral")
            .where(func.length(RawComment.text_content) >= 25)
            .where(func.length(RawComment.text_content) <= 300)
            .order_by(AIAnalysis.analyzed_at.desc())
            .limit(limit)
        )
        res_neu = await db.execute(q_neu)
        rows_neu = res_neu.all()
        neu_list = []
        for r in rows_neu:
            clean_text = " ".join(r.text_content.strip().replace("", "").split())
            if len(clean_text) > 220:
                clean_text = clean_text[:217] + "..."
            neu_list.append({
                "platform": r.platform or "Publik",
                "emotion": r.emotion or "netral",
                "topics": r.topic_tags or [],
                "quote": clean_text
            })
        return neu_list

    overview_response = await get_stats_overview(db=db)
    trend_response = await get_stats_trend(db=db)
    
    if overview_response["data"]["total_data"] == 0:
        return "Sistem belum memiliki data komentar. Silakan jalankan Data Scraper terlebih dahulu untuk melihat wawasan AI."

    positive_issues = await get_paired_topic_exemplars("positif", limit=3)
    negative_issues = await get_paired_topic_exemplars("negatif", limit=3)
    neutral_suggestions = await get_neutral_suggestions(limit=2)
    
    trend_data = trend_response["data"]
    date_range = "Belum ada data tanggal"
    if trend_data:
        start_date = trend_data[0]["date"]
        end_date = trend_data[-1]["date"]
        date_range = f"{start_date} s/d {end_date}"

    combined_stats = {
        "overview": overview_response["data"],
        "date_range": date_range,
        "top_positive_issues": positive_issues,
        "top_negative_issues": negative_issues,
        "neutral_suggestions": neutral_suggestions
    }
    
    from app.services.ai_engine import generate_executive_summary
    return await generate_executive_summary(combined_stats)

@router.get("/stats/insight/current")
async def get_current_insight(db: AsyncSession = Depends(get_db)):
    try:
        latest_analysis_q = select(func.max(AIAnalysis.analyzed_at))
        latest_analysis = (await db.execute(latest_analysis_q)).scalar()
        
        latest_insight_q = select(GeneratedInsight).order_by(GeneratedInsight.created_at.desc()).limit(1)
        latest_insight = (await db.execute(latest_insight_q)).scalar_one_or_none()
        
        if latest_insight and (not latest_analysis or latest_insight.created_at >= latest_analysis):
            return {
                "status": "success",
                "data": {
                    "id": str(latest_insight.id),
                    "insight_text": latest_insight.insight_text,
                    "created_at": latest_insight.created_at
                }
            }
            
        new_text = await generate_insight_internal(db)
        new_insight = GeneratedInsight(insight_text=new_text)
        db.add(new_insight)
        await db.commit()
        await db.refresh(new_insight)
        
        return {
            "status": "success",
            "data": {
                "id": str(new_insight.id),
                "insight_text": new_insight.insight_text,
                "created_at": new_insight.created_at
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stats/insight/generate")
async def generate_insight_force(db: AsyncSession = Depends(get_db)):
    try:
        new_text = await generate_insight_internal(db)
        new_insight = GeneratedInsight(insight_text=new_text)
        db.add(new_insight)
        await db.commit()
        await db.refresh(new_insight)
        return {
            "status": "success",
            "data": {
                "id": str(new_insight.id),
                "insight_text": new_insight.insight_text,
                "created_at": new_insight.created_at
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/insight/history")
async def get_insight_history(
    page: int = Query(1, ge=1), 
    size: int = Query(5, ge=1, le=50), 
    db: AsyncSession = Depends(get_db)
):
    try:
        offset = (page - 1) * size
        
        total_q = select(func.count(GeneratedInsight.id))
        total_items = (await db.execute(total_q)).scalar() or 0
        
        q = select(GeneratedInsight).order_by(GeneratedInsight.created_at.desc()).offset(offset).limit(size)
        res = await db.execute(q)
        insights = res.scalars().all()
        
        return {
            "status": "success",
            "data": {
                "items": [
                    {
                        "id": str(i.id),
                        "insight_text": i.insight_text,
                        "created_at": i.created_at
                    } for i in insights
                ],
                "total": total_items,
                "page": page,
                "size": size,
                "total_pages": (total_items + size - 1) // size if size else 0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/stats/insight/{insight_id}")
async def delete_insight(insight_id: str, db: AsyncSession = Depends(get_db)):
    try:
        q = select(GeneratedInsight).where(cast(GeneratedInsight.id, String) == insight_id)
        res = await db.execute(q)
        insight = res.scalar_one_or_none()
        if not insight:
            raise HTTPException(status_code=404, detail="Rangkuman tidak ditemukan")
        
        await db.delete(insight)
        await db.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/comments")
async def get_comments(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    sentiment: Optional[str] = None,
    platform: Optional[str] = None,
    emotion: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    try:
        offset = (page - 1) * size
        
        query = select(RawComment, AIAnalysis).outerjoin(AIAnalysis, RawComment.id == AIAnalysis.comment_id)
        total_query = select(func.count(RawComment.id)).outerjoin(AIAnalysis, RawComment.id == AIAnalysis.comment_id)
        
        if sentiment:
            query = query.where(func.lower(AIAnalysis.sentiment) == sentiment.lower())
            total_query = total_query.where(func.lower(AIAnalysis.sentiment) == sentiment.lower())
        if platform:
            query = query.where(func.lower(RawComment.platform) == platform.lower())
            total_query = total_query.where(func.lower(RawComment.platform) == platform.lower())
        if emotion:
            query = query.where(func.lower(AIAnalysis.emotion) == emotion.lower())
            total_query = total_query.where(func.lower(AIAnalysis.emotion) == emotion.lower())
        if search:
            pattern = f"%{search.strip()}%"
            search_filter = or_(
                RawComment.text_content.ilike(pattern),
                RawComment.author_name.ilike(pattern),
                RawComment.platform.ilike(pattern),
                AIAnalysis.sentiment.ilike(pattern),
                AIAnalysis.emotion.ilike(pattern),
                cast(AIAnalysis.topic_tags, String).ilike(pattern),
                AIAnalysis.ai_reasoning.ilike(pattern)
            )
            query = query.where(search_filter)
            total_query = total_query.where(search_filter)
        if start_date:
            try:
                from datetime import datetime, timezone
                s_dt = datetime.fromisoformat(start_date.strip())
                if s_dt.tzinfo is None:
                    s_dt = s_dt.replace(tzinfo=timezone.utc)
                query = query.where(RawComment.posted_at >= s_dt)
                total_query = total_query.where(RawComment.posted_at >= s_dt)
            except Exception:
                pass
        if end_date:
            try:
                from datetime import datetime, time, timezone
                e_dt_raw = datetime.fromisoformat(end_date.strip())
                e_dt = datetime.combine(e_dt_raw.date(), time.max).replace(tzinfo=timezone.utc)
                query = query.where(RawComment.posted_at <= e_dt)
                total_query = total_query.where(RawComment.posted_at <= e_dt)
            except Exception:
                pass
            
        query = query.order_by(RawComment.posted_at.desc()).offset(offset).limit(size)
        
        result = await db.execute(query)
        rows = result.all()

        data = []
        for comment, analysis in rows:
            data.append({
                "id": str(comment.id),
                "text_content": comment.text_content,
                "platform": comment.platform,
                "author_name": comment.author_name,
                "source_url": comment.source_url,
                "posted_at": comment.posted_at.isoformat() if comment.posted_at else None,
                "sentiment": analysis.sentiment if analysis else None,
                "emotion": analysis.emotion if analysis else None,
                "topic_tags": analysis.topic_tags if analysis else [],
                "ai_reasoning": analysis.ai_reasoning if analysis else None,
                "is_edited": (comment.status == "EDITED")
            })

        total_result = await db.execute(total_query)
        total_count = total_result.scalar() or 0

        return {
            "status": "success",
            "data": data,
            "meta": {
                "page": page,
                "size": size,
                "total": total_count
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class UpdateCommentRequest(BaseModel):
    sentiment: Optional[str] = None
    emotion: Optional[str] = None
    topic_tags: Optional[List[str]] = None
    ai_reasoning: Optional[str] = None
    platform: Optional[str] = None
    author_name: Optional[str] = None
    posted_at: Optional[str] = None

@router.patch("/comments/{comment_id}")
async def update_comment(
    comment_id: str,
    request: UpdateCommentRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin_role)
):
    import uuid
    from datetime import datetime, timezone
    try:
        c_uuid = uuid.UUID(comment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Format ID komentar tidak valid.")
    
    query = select(RawComment).where(RawComment.id == c_uuid)
    result = await db.execute(query)
    raw_comment = result.scalar_one_or_none()
    if not raw_comment:
        raise HTTPException(status_code=404, detail="Komentar tidak ditemukan.")
    
    if request.platform is not None:
        raw_comment.platform = request.platform.strip()
    if request.author_name is not None:
        raw_comment.author_name = request.author_name.strip()
    if request.posted_at:
        try:
            dt = datetime.fromisoformat(request.posted_at.strip())
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            raw_comment.posted_at = dt
        except Exception:
            pass
    
    analysis_query = select(AIAnalysis).where(AIAnalysis.comment_id == c_uuid)
    analysis_res = await db.execute(analysis_query)
    analysis = analysis_res.scalar_one_or_none()
    
    if not analysis:
        analysis = AIAnalysis(
            comment_id=c_uuid,
            sentiment="NETRAL",
            emotion="netral",
            topic_tags=[],
            ai_reasoning="",
            analyzed_at=datetime.now(timezone.utc)
        )
        db.add(analysis)
    
    if request.sentiment is not None:
        analysis.sentiment = request.sentiment.strip()
    if request.emotion is not None:
        analysis.emotion = request.emotion.strip()
    if request.topic_tags is not None:
        analysis.topic_tags = request.topic_tags
    if request.ai_reasoning is not None:
        analysis.ai_reasoning = request.ai_reasoning.strip()
    
    raw_comment.status = "EDITED"
    await db.commit()
    await db.refresh(raw_comment)
    await db.refresh(analysis)
    
    return {
        "status": "success",
        "message": "Data komentar berhasil diperbarui.",
        "data": {
            "id": str(raw_comment.id),
            "text_content": raw_comment.text_content,
            "platform": raw_comment.platform,
            "author_name": raw_comment.author_name,
            "posted_at": raw_comment.posted_at.isoformat() if raw_comment.posted_at else None,
            "sentiment": analysis.sentiment,
            "emotion": analysis.emotion,
            "topic_tags": analysis.topic_tags,
            "ai_reasoning": analysis.ai_reasoning,
            "is_edited": True
        }
    }

@router.get("/comments/export/excel")
async def export_comments_excel(
    sentiment: Optional[str] = None,
    platform: Optional[str] = None,
    emotion: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    try:
        query = select(RawComment, AIAnalysis).outerjoin(AIAnalysis, RawComment.id == AIAnalysis.comment_id)
        
        if sentiment:
            query = query.where(func.lower(AIAnalysis.sentiment) == sentiment.lower())
        if platform:
            query = query.where(func.lower(RawComment.platform) == platform.lower())
        if emotion:
            query = query.where(func.lower(AIAnalysis.emotion) == emotion.lower())
        if search:
            pattern = f"%{search.strip()}%"
            search_filter = or_(
                RawComment.text_content.ilike(pattern),
                RawComment.author_name.ilike(pattern),
                RawComment.platform.ilike(pattern),
                AIAnalysis.sentiment.ilike(pattern),
                AIAnalysis.emotion.ilike(pattern),
                cast(AIAnalysis.topic_tags, String).ilike(pattern),
                AIAnalysis.ai_reasoning.ilike(pattern)
            )
            query = query.where(search_filter)
        if start_date:
            try:
                from datetime import datetime, timezone
                s_dt = datetime.fromisoformat(start_date.strip())
                if s_dt.tzinfo is None:
                    s_dt = s_dt.replace(tzinfo=timezone.utc)
                query = query.where(RawComment.posted_at >= s_dt)
            except Exception:
                pass
        if end_date:
            try:
                from datetime import datetime, time, timezone
                e_dt_raw = datetime.fromisoformat(end_date.strip())
                e_dt = datetime.combine(e_dt_raw.date(), time.max).replace(tzinfo=timezone.utc)
                query = query.where(RawComment.posted_at <= e_dt)
            except Exception:
                pass
            
        query = query.order_by(RawComment.posted_at.desc()).limit(1000)
        
        result = await db.execute(query)
        rows = result.all()
        
        from xml.sax.saxutils import escape as xml_escape
        
        xml_lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<?mso-application progid="Excel.Sheet"?>',
            '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"',
            ' xmlns:o="urn:schemas-microsoft-com:office:office"',
            ' xmlns:x="urn:schemas-microsoft-com:office:excel"',
            ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"',
            ' xmlns:html="http://www.w3.org/TR/REC-html40">',
            ' <Styles>',
            '  <Style ss:ID="Default" ss:Name="Normal">',
            '   <Alignment ss:Vertical="Center"/>',
            '   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1A1C1D"/>',
            '  </Style>',
            '  <Style ss:ID="Header">',
            '   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>',
            '   <Borders>',
            '    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#002D57"/>',
            '   </Borders>',
            '   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>',
            '   <Interior ss:Color="#003F7A" ss:Pattern="Solid"/>',
            '  </Style>',
            '  <Style ss:ID="DataCell">',
            '   <Alignment ss:Vertical="Center" ss:WrapText="1"/>',
            '   <Borders>',
            '    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>',
            '    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>',
            '   </Borders>',
            '  </Style>',
            '  <Style ss:ID="DateCell">',
            '   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>',
            '   <Borders>',
            '    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>',
            '    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>',
            '   </Borders>',
            '  </Style>',
            ' </Styles>',
            ' <Worksheet ss:Name="Data Komentar Si-SORA">',
            '  <Table ss:DefaultRowHeight="22">',
            '   <Column ss:Width="70"/>',
            '   <Column ss:Width="110"/>',
            '   <Column ss:Width="130"/>',
            '   <Column ss:Width="320"/>',
            '   <Column ss:Width="90"/>',
            '   <Column ss:Width="90"/>',
            '   <Column ss:Width="160"/>',
            '   <Column ss:Width="260"/>',
            '   <Column ss:Width="110"/>',
            '   <Column ss:Width="200"/>',
            '   <Row ss:StyleID="Header" ss:Height="28">',
            '    <Cell><Data ss:Type="String">Platform</Data></Cell>',
            '    <Cell><Data ss:Type="String">Pengirim</Data></Cell>',
            '    <Cell><Data ss:Type="String">Waktu Post</Data></Cell>',
            '    <Cell><Data ss:Type="String">Isi Komentar</Data></Cell>',
            '    <Cell><Data ss:Type="String">Sentimen</Data></Cell>',
            '    <Cell><Data ss:Type="String">Emosi</Data></Cell>',
            '    <Cell><Data ss:Type="String">Topik</Data></Cell>',
            '    <Cell><Data ss:Type="String">Penalaran AI</Data></Cell>',
            '    <Cell><Data ss:Type="String">Status Data</Data></Cell>',
            '    <Cell><Data ss:Type="String">Tautan Sumber</Data></Cell>',
            '   </Row>'
        ]
        
        for comment, analysis in rows:
            platform_val = xml_escape(str(comment.platform or ""))
            author_val = xml_escape(str(comment.author_name or "anon"))
            date_val = comment.posted_at.strftime("%Y-%m-%d %H:%M:%S") if comment.posted_at else ""
            text_val = xml_escape(str(comment.text_content or ""))
            sentiment_val = xml_escape(str(analysis.sentiment or "")) if analysis else ""
            emotion_val = xml_escape(str(analysis.emotion or "")) if analysis else ""
            topics_str = ", ".join(analysis.topic_tags) if (analysis and analysis.topic_tags) else ""
            topics_val = xml_escape(topics_str)
            reasoning_val = xml_escape(str(analysis.ai_reasoning or "")) if analysis else ""
            status_val = "Diedit Manual" if comment.status == "EDITED" else "Asli Sistem"
            url_val = xml_escape(str(comment.source_url or ""))
            
            xml_lines.append(
                f'   <Row>'
                f'<Cell ss:StyleID="DataCell"><Data ss:Type="String">{platform_val}</Data></Cell>'
                f'<Cell ss:StyleID="DataCell"><Data ss:Type="String">{author_val}</Data></Cell>'
                f'<Cell ss:StyleID="DateCell"><Data ss:Type="String">{date_val}</Data></Cell>'
                f'<Cell ss:StyleID="DataCell"><Data ss:Type="String">{text_val}</Data></Cell>'
                f'<Cell ss:StyleID="DataCell"><Data ss:Type="String">{sentiment_val}</Data></Cell>'
                f'<Cell ss:StyleID="DataCell"><Data ss:Type="String">{emotion_val}</Data></Cell>'
                f'<Cell ss:StyleID="DataCell"><Data ss:Type="String">{topics_val}</Data></Cell>'
                f'<Cell ss:StyleID="DataCell"><Data ss:Type="String">{reasoning_val}</Data></Cell>'
                f'<Cell ss:StyleID="DataCell"><Data ss:Type="String">{status_val}</Data></Cell>'
                f'<Cell ss:StyleID="DataCell"><Data ss:Type="String">{url_val}</Data></Cell>'
                f'</Row>'
            )
            
        xml_lines.extend([
            '  </Table>',
            ' </Worksheet>',
            '</Workbook>'
        ])
        
        xml_content = "\n".join(xml_lines)
        
        from datetime import datetime, timezone
        filename = f"sisora_komentar_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.xls"
        
        return Response(
            content=xml_content,
            media_type="application/vnd.ms-excel",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.models.models import ScraperTarget, ScraperLog

class TargetRequest(BaseModel):
    platform: str
    target_id: str
    cron_time: str = "02:00"

@router.get("/targets")
async def get_targets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_role)
):
    query = select(ScraperTarget).order_by(ScraperTarget.created_at.desc())
    result = await db.execute(query)
    targets = result.scalars().all()
    return {
        "status": "success",
        "data": [
            {
                "id": str(t.id),
                "platform": t.platform,
                "target_id": t.target_id,
                "is_active": t.is_active,
                "cron_time": t.cron_time
            } for t in targets
        ]
    }

@router.post("/targets")
async def add_target(
    request: TargetRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_role)
):
    new_target = ScraperTarget(
        platform=request.platform,
        target_id=request.target_id,
        cron_time=request.cron_time
    )
    db.add(new_target)
    await db.commit()
    return {"status": "success", "message": "Target penjadwalan berhasil ditambahkan."}

@router.patch("/targets/{target_id}/toggle")
async def toggle_target(
    target_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_role)
):
    query = select(ScraperTarget).where(cast(ScraperTarget.id, String) == target_id)
    result = await db.execute(query)
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Target tidak ditemukan")
    
    target.is_active = not target.is_active
    await db.commit()
    return {
        "status": "success", 
        "message": f"Target {'diaktifkan' if target.is_active else 'dinonaktifkan'}.",
        "is_active": target.is_active
    }

@router.delete("/targets/{target_id}")
async def delete_target(
    target_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_role)
):
    query = select(ScraperTarget).where(cast(ScraperTarget.id, String) == target_id)
    result = await db.execute(query)
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Target tidak ditemukan")
    
    await db.delete(target)
    await db.commit()
    return {"status": "success", "message": "Target berhasil dihapus."}

class SurveyImportRequest(BaseModel):
    filename: str
    column_name: str
    comments: List[str]
    batch_index: int = 1
    total_batches: int = 1
    is_final_batch: bool = False
    total_survey_comments: Optional[int] = None

@router.post("/survey/import")
async def import_survey_comments(
    request: SurveyImportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_role)
):
    import time
    from datetime import datetime, timezone
    from app.services.local_nlp import (
        analyze_sentiment_local,
        detect_emotion_local,
        extract_topics_local,
        generate_reasoning_local
    )

    start_time = time.perf_counter()
    try:
        raw_list = request.comments[:1000]
        cleaned_comments = []
        for c in raw_list:
            t = str(c).strip() if c else ""
            if len(t) >= 3:
                cleaned_comments.append(t)

        processed_results = []

        for text_content in cleaned_comments:
            query = select(RawComment.id).where(
                RawComment.text_content == text_content,
                RawComment.platform == "Survei"
            ).limit(1)
            exist_result = await db.execute(query)
            if exist_result.scalar_one_or_none():
                continue

            try:
                new_comment = RawComment(
                    text_content=text_content,
                    platform="Survei",
                    author_name="Responden Survei",
                    source_url=request.filename,
                    posted_at=datetime.now(timezone.utc),
                    status="PROCESSED"
                )
                db.add(new_comment)
                await db.flush()

                local_sentiment = analyze_sentiment_local(text_content)
                local_emotion = detect_emotion_local(text_content, local_sentiment)
                local_topics = extract_topics_local(text_content, local_sentiment)
                local_reasoning = generate_reasoning_local(
                    text_content, local_sentiment, local_emotion, local_topics
                )

                new_analysis = AIAnalysis(
                    comment_id=new_comment.id,
                    sentiment=local_sentiment,
                    emotion=local_emotion,
                    topic_tags=local_topics,
                    ai_reasoning=local_reasoning
                )
                db.add(new_analysis)

                processed_results.append({
                    "id": str(new_comment.id),
                    "text": text_content,
                    "sentiment": local_sentiment
                })
            except Exception:
                continue

        await db.commit()

        elapsed = round(time.perf_counter() - start_time, 2)
        if request.is_final_batch:
            final_count = request.total_survey_comments if request.total_survey_comments is not None else len(processed_results)
            try:
                log_entry = ScraperLog(
                    platform="Survei",
                    target_id=request.filename,
                    status="BERHASIL",
                    comments_count=final_count,
                    execution_time_sec=elapsed,
                    error_message=None
                )
                db.add(log_entry)
                await db.commit()
            except Exception:
                pass

        return {
            "status": "success",
            "message": f"Batch {request.batch_index}/{request.total_batches} berhasil disimpan ({len(processed_results)} komentar baru).",
            "batch_index": request.batch_index,
            "total_batches": request.total_batches,
            "saved_count": len(processed_results),
            "execution_time": elapsed
        }
    except Exception as e:
        await db.rollback()
        elapsed = round(time.perf_counter() - start_time, 2)
        if request.is_final_batch or request.batch_index == 1:
            try:
                log_entry = ScraperLog(
                    platform="Survei",
                    target_id=request.filename,
                    status="GAGAL",
                    comments_count=0,
                    execution_time_sec=elapsed,
                    error_message=str(e)[:500]
                )
                db.add(log_entry)
                await db.commit()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/survey/reanalyze")
async def reanalyze_survey_comments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_role)
):
    import time
    from app.services.local_nlp import (
        analyze_sentiment_local,
        detect_emotion_local,
        extract_topics_local,
        generate_reasoning_local
    )

    start_time = time.perf_counter()
    try:
        query = (
            select(RawComment, AIAnalysis)
            .join(AIAnalysis, RawComment.id == AIAnalysis.comment_id)
            .where(RawComment.platform == "Survei")
        )
        result = await db.execute(query)
        pairs = result.all()

        total_scanned = len(pairs)
        total_updated = 0
        corrected_pos_to_neg = 0
        corrected_pos_to_neu = 0
        corrected_neu_to_neg = 0
        unchanged = 0

        for comment, analysis in pairs:
            if comment.status == "EDITED":
                unchanged += 1
                continue

            old_sent = (analysis.sentiment or "").upper()
            new_sent = analyze_sentiment_local(comment.text_content)
            new_emotion = detect_emotion_local(comment.text_content, new_sent)
            new_topics = extract_topics_local(comment.text_content, new_sent)
            new_reasoning = generate_reasoning_local(
                comment.text_content, new_sent, new_emotion, new_topics
            )

            changed = False
            if old_sent != new_sent or analysis.emotion != new_emotion or analysis.topic_tags != new_topics:
                changed = True

            if old_sent == "POSITIF" and new_sent == "NEGATIF":
                corrected_pos_to_neg += 1
            elif old_sent == "POSITIF" and new_sent == "NETRAL":
                corrected_pos_to_neu += 1
            elif old_sent == "NETRAL" and new_sent == "NEGATIF":
                corrected_neu_to_neg += 1

            if changed:
                analysis.sentiment = new_sent
                analysis.emotion = new_emotion
                analysis.topic_tags = new_topics
                analysis.ai_reasoning = new_reasoning
                total_updated += 1
            else:
                unchanged += 1

            if (total_updated + unchanged) % 1000 == 0:
                await db.flush()

        await db.commit()

        operator_name = current_user.username or "Admin"
        try:
            await build_and_persist_wordcloud_snapshots(db, operator_username=f"{operator_name} (Audit Ulang Survei)")
        except Exception:
            pass

        elapsed = round(time.perf_counter() - start_time, 2)
        try:
            log_entry = ScraperLog(
                platform="Survei",
                target_id="Audit Ulang Sentimen Survei",
                status="BERHASIL",
                comments_count=total_updated,
                execution_time_sec=elapsed,
                error_message=None
            )
            db.add(log_entry)
            await db.commit()
        except Exception:
            pass

        return {
            "status": "success",
            "message": f"Audit ulang sentimen survei berhasil. {total_updated} dari {total_scanned} data dikoreksi.",
            "data": {
                "total_scanned": total_scanned,
                "total_updated": total_updated,
                "corrected_pos_to_neg": corrected_pos_to_neg,
                "corrected_pos_to_neu": corrected_pos_to_neu,
                "corrected_neu_to_neg": corrected_neu_to_neg,
                "unchanged": unchanged,
                "execution_time_sec": elapsed
            }
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scraper/logs")
async def get_scraper_logs(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_role)
):
    import math
    try:
        total_query = select(func.count(ScraperLog.id))
        total_res = await db.execute(total_query)
        total_records = total_res.scalar() or 0

        offset_val = (page - 1) * size
        query = select(ScraperLog).order_by(ScraperLog.created_at.desc()).offset(offset_val).limit(size)
        result = await db.execute(query)
        logs = result.scalars().all()
        return {
            "status": "success",
            "data": [
                {
                    "id": str(log.id),
                    "platform": log.platform,
                    "target_id": log.target_id,
                    "status": log.status,
                    "comments_count": log.comments_count,
                    "execution_time_sec": log.execution_time_sec,
                    "error_message": log.error_message,
                    "created_at": log.created_at.isoformat() if log.created_at else None
                }
                for log in logs
            ],
            "meta": {
                "page": page,
                "size": size,
                "total": total_records,
                "total_pages": math.ceil(total_records / size) if total_records > 0 else 1
            }
        }
    except Exception:
        return {
            "status": "success",
            "data": [],
            "meta": {
                "page": page,
                "size": size,
                "total": 0,
                "total_pages": 1
            }
        }


@router.post("/cron/trigger-scraper")
async def trigger_headless_scraper(
    api_key: str = Query(..., description="API Key untuk keamanan cron"),
    db: AsyncSession = Depends(get_db)
):
    import os
    from app.services.scheduler import execute_daily_scraping
    
    expected_key = os.getenv("CRON_SECRET_KEY")
    if not expected_key or api_key != expected_key:
        raise HTTPException(status_code=401, detail="Unauthorized cron trigger")
    
    import asyncio
    asyncio.create_task(execute_daily_scraping())
    
    return {"status": "success", "message": "Scraping task triggered in background."}
