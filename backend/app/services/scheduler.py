import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.future import select
from app.db.session import AsyncSessionLocal as SessionLocal
from app.models.models import ScraperTarget
from app.services.scrapers.pipeline import run_scraping_pipeline
from datetime import datetime

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def execute_daily_scraping():
    logger.info(f"Memulai tugas scraping harian pada {datetime.now()}")
    async with SessionLocal() as db:
        query = select(ScraperTarget).where(ScraperTarget.is_active == True)
        result = await db.execute(query)
        targets = result.scalars().all()
        
        for target in targets:
            logger.info(f"Mengeksekusi target otomatis: {target.platform} - {target.target_id}")
            try:
                await run_scraping_pipeline(target.platform, target.target_id, 20, db)
                logger.info(f"Sukses scraping otomatis: {target.platform}")
            except Exception as e:
                logger.error(f"Gagal scraping {target.platform} ({target.target_id}): {e}")

from datetime import datetime, timedelta, timezone
from sqlalchemy import delete
from app.models.models import RawComment

async def execute_data_retention():
    logger.info("Memulai pembersihan data lama (> 6 bulan).")
    async with SessionLocal() as db:
        six_months_ago = datetime.now(timezone.utc) - timedelta(days=180)
        try:
            query = delete(RawComment).where(RawComment.posted_at < six_months_ago)
            result = await db.execute(query)
            await db.commit()
            logger.info(f"Pembersihan sukses: {result.rowcount} komentar lama dihapus.")
        except Exception as e:
            logger.error(f"Gagal melakukan pembersihan data: {e}")

def start_scheduler():
    scheduler.add_job(execute_daily_scraping, 'cron', hour=2, minute=0, id='daily_scraping_job', replace_existing=True)
    scheduler.add_job(execute_data_retention, 'cron', day=1, hour=3, minute=0, id='monthly_retention_job', replace_existing=True)
    scheduler.start()
    logger.info("Auto-Pilot Scheduler berhasil dimulai.")

def stop_scheduler():
    scheduler.shutdown()
    logger.info("Auto-Pilot Scheduler dimatikan.")
