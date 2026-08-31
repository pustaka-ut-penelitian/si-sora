from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, String
from app.db.session import get_db
from app.models.models import RawComment, AIAnalysis, User, GeneratedInsight
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
    try:
        from app.services.scrapers.pipeline import run_scraping_pipeline
        comments = await run_scraping_pipeline(request.source, request.target_id, request.limit, db)
        return {
            "status": "success",
            "message": f"Berhasil menarik dan menganalisis {len(comments)} komentar.",
            "data": comments
        }
    except Exception as e:
        await db.rollback()
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

@router.get("/stats/wordcloud")
async def get_wordcloud(
    sentiment: Optional[str] = "all",
    layout: Optional[str] = "desktop", 
    db: AsyncSession = Depends(get_db)
):
    try:
        from app.services.wordcloud_gen import generate_wordcloud_base64
        import re
        
        target_sentiment = sentiment.lower() if sentiment else "all"
        
        if target_sentiment == "all":
            topic_query = select(AIAnalysis.topic_tags)
        else:
            topic_query = select(AIAnalysis.topic_tags).where(func.lower(AIAnalysis.sentiment) == target_sentiment)
            
        topic_result = await db.execute(topic_query)
        topics = topic_result.scalars().all()
        
        word_freqs = {}
        for t_list in topics:
            if not t_list: continue
            for t in t_list:
                t = t.lower().replace("_", " ").strip()
                if t:
                    word_freqs[t] = word_freqs.get(t, 0) + 1
                    
        if len(word_freqs) < 30:
            stopwords = {
                "dan", "di", "ke", "dari", "yang", "ini", "itu", "untuk", "pada", 
                "adalah", "dengan", "saya", "kamu", "dia", "mereka", "kita", "ut", 
                "terbuka", "universitas", "ada", "bisa", "sudah", "akan", "juga", 
                "atau", "karena", "agar", "tidak", "gak", "nggak", "tak", "ya", 
                "saja", "sih", "dong", "kan", "lah", "deh", "kok", "nih", "kah", 
                "pun", "nya", "dalam", "bagi", "oleh", "saat", "bila", "jika",
                "yg", "dgn", "dgnnya", "sdh", "tp", "tapi", "klo", "kalo", "utk",
                "banget", "sangat", "lebih", "paling", "agak", "masih", "belum",
                "tau", "tahu", "mau", "ingin", "bisa", "dapat", "sama", "aja"
            }
            
            if target_sentiment == "all":
                comment_query = select(RawComment.text_content).limit(80)
            else:
                comment_query = select(RawComment.text_content)\
                    .join(AIAnalysis, RawComment.id == AIAnalysis.comment_id)\
                    .where(func.lower(AIAnalysis.sentiment) == target_sentiment)\
                    .limit(80)
                    
            comm_result = await db.execute(comment_query)
            comments = comm_result.scalars().all()
            
            for text in comments:
                if not text: continue
                words = re.findall(r'[a-zA-Z]{3,}', text.lower())
                for i in range(len(words) - 1):
                    w1, w2 = words[i], words[i+1]
                    if w1 not in stopwords and w2 not in stopwords and len(w1) > 2 and len(w2) > 2 and w1 != w2:
                        phrase = f"{w1} {w2}"
                        word_freqs[phrase] = word_freqs.get(phrase, 0) + 1
                        
                if len(word_freqs) < 20:
                    for w in words:
                        if w not in stopwords and len(w) > 3:
                            word_freqs[w] = word_freqs.get(w, 0) + 1
                        
        img_base64 = generate_wordcloud_base64(word_freqs, target_sentiment, layout)
        
        return {
            "status": "success",
            "data": {
                "sentiment": target_sentiment,
                "image": img_base64
            }
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
    
    async def get_top_topics_by_sentiment(sent: str, limit: int = 5):
        q = select(AIAnalysis.topic_tags).where(func.lower(AIAnalysis.sentiment) == sent)
        res = await db.execute(q)
        t_rows = res.scalars().all()
        c = Counter()
        for ts in t_rows:
            if ts:
                for t in ts: c[t.lower().strip()] += 1
        return [{"name": t[0].title(), "count": t[1]} for t in c.most_common(limit)]

    overview_response = await get_stats_overview(db=db)
    trend_response = await get_stats_trend(db=db)
    
    if overview_response["data"]["total_data"] == 0:
        return "Sistem belum memiliki data komentar. Silakan jalankan Data Scraper terlebih dahulu untuk melihat wawasan AI."

    top_positive = await get_top_topics_by_sentiment("positif")
    top_negative = await get_top_topics_by_sentiment("negatif")
    
    trend_data = trend_response["data"]
    date_range = "Belum ada data tanggal"
    if trend_data:
        start_date = trend_data[0]["date"]
        end_date = trend_data[-1]["date"]
        date_range = f"{start_date} s/d {end_date}"

    combined_stats = {
        "overview": overview_response["data"],
        "date_range": date_range,
        "top_positive_topics": top_positive,
        "top_negative_topics": top_negative
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
            search_pattern = f"%{search.strip()}%"
            query = query.where(RawComment.text_content.ilike(search_pattern))
            total_query = total_query.where(RawComment.text_content.ilike(search_pattern))
            
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

from app.models.models import ScraperTarget

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
