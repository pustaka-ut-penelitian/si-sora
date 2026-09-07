from typing import List
import re
from app.services.scrapers.playstore_scraper import PlayStoreScraper
from app.services.scrapers.youtube_scraper import YouTubeScraper
from app.services.scrapers.apify_scraper import ApifyScraper
from app.services.scrapers.tiktok_scraper import TikTokScraper
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from app.services.ai_engine import analyze_comments_batch
from app.services.local_nlp import analyze_sentiment_local, detect_emotion_local, extract_topics_local
from app.models.models import RawComment, AIAnalysis
from datetime import datetime, timezone
import asyncio

def get_scraper(source: str):
    s = source.lower().strip()
    if s == "playstore":
        return PlayStoreScraper()
    elif s == "youtube":
        return YouTubeScraper()
    elif s in ("apify", "instagram"):
        return ApifyScraper()
    elif s == "tiktok":
        return TikTokScraper()
    else:
        raise ValueError(f"Sumber {source} tidak dikenali.")

def chunk_list(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]

async def run_scraping_pipeline(source: str, target_id: str, limit: int, db: AsyncSession) -> List[dict]:
    scraper = get_scraper(source)
    raw_comments = await asyncio.to_thread(scraper.fetch_comments, target_id, limit)
    
    spam_pattern = re.compile(r'(http://|https://|www\.|bit\.ly|promo|diskon|judi|slot|pinjol|wa\.me|t\.me)', re.IGNORECASE)
    
    filtered_comments = []
    for c in raw_comments:
        text = c.get("text_content", "").strip()
        if len(text) > 3 and not spam_pattern.search(text):
            filtered_comments.append(c)
    
    processed_results = []
    batch_jobs = []
    
    for comment_data in filtered_comments:
        text_content = comment_data["text_content"]
        
        query = select(RawComment.id).where(
            RawComment.text_content == text_content,
            RawComment.platform == comment_data["platform"]
        ).limit(1)
        exist_result = await db.execute(query)
        if exist_result.scalar_one_or_none():
            continue 
            
        try:
            new_comment = RawComment(
                text_content=text_content,
                platform=comment_data["platform"],
                source_url=comment_data["source_url"],
                posted_at=comment_data["posted_at"] if comment_data.get("posted_at") else datetime.now(timezone.utc),
                status="PROCESSED"
            )
            db.add(new_comment)
            await db.flush() 
            
            local_sentiment = analyze_sentiment_local(text_content)
            local_emotion = detect_emotion_local(text_content, local_sentiment)
            local_topics = extract_topics_local(text_content, local_sentiment)
            
            new_analysis = AIAnalysis(
                comment_id=new_comment.id,
                sentiment=local_sentiment,
                emotion=local_emotion,
                topic_tags=local_topics,
                ai_reasoning="Analisis internal sistem"
            )
            db.add(new_analysis)
            
            processed_results.append({
                "id": str(new_comment.id),
                "text": text_content,
                "sentiment": local_sentiment
            })
            
            word_count = len(text_content.split())
            needs_groq = word_count >= 3
            
            if needs_groq:
                batch_jobs.append({
                    "id": str(new_comment.id),
                    "text": text_content
                })
                
        except Exception as e:
            continue
            
    await db.commit() 
    
    if batch_jobs:
        if len(batch_jobs) > 100:
            batch_jobs = batch_jobs[:100]
            
        batches = list(chunk_list(batch_jobs, 10))
        for batch in batches:
            try:
                groq_results = await analyze_comments_batch(batch)
                
                if not groq_results:
                    continue
                    
                for job in batch:
                    job_id = job["id"]
                    if job_id in groq_results:
                        import uuid
                        ai_res = groq_results[job_id]
                        
                        stmt = update(AIAnalysis).where(
                            AIAnalysis.comment_id == uuid.UUID(job_id)
                        ).values(
                            sentiment=ai_res.sentiment,
                            emotion=ai_res.emotion,
                            topic_tags=ai_res.topic_tags,
                            ai_reasoning=ai_res.ai_reasoning
                        )
                        await db.execute(stmt)
                        
                        for p in processed_results:
                            if p["id"] == job_id:
                                p["sentiment"] = ai_res.sentiment
                                
                await db.commit()
                await asyncio.sleep(2)
                
            except Exception as e:
                import logging
                logging.error(f"Error AI Batching Pipeline: {e}")
                continue

    return processed_results
