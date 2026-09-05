from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from contextlib import asynccontextmanager

from app.db.session import get_db, AsyncSessionLocal as SessionLocal
from app.api.routes import router as api_router
from app.api.auth import router as auth_router
from app.models.models import User
from app.core.security import get_password_hash
from sqlalchemy.future import select
from app.services.scheduler import start_scheduler, stop_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with SessionLocal() as db:
            query = select(User).where(User.username == "admin")
            result = await db.execute(query)
            admin_exists = result.scalar_one_or_none()
            if not admin_exists:
                new_admin = User(
                    username="admin",
                    password_hash=get_password_hash("admin123"),
                    role="ADMIN"
                )
                db.add(new_admin)
                await db.commit()
    except Exception as e:
        import logging
        logging.error(f"Lifespan admin init: {e}")
    
    try:
        start_scheduler()
    except Exception as e:
        import logging
        logging.error(f"Lifespan scheduler start: {e}")
    
    yield
    
    try:
        stop_scheduler()
    except Exception as e:
        import logging
        logging.error(f"Lifespan scheduler stop: {e}")

app = FastAPI(title="SI SORA API (Sistem Informasi Social Opinion Reaction Analytics)", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_origin_regex=r"https://.*(\.netlify\.app|\.vercel\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(api_router, prefix="/api")

@app.get("/")
@app.get("/api")
@app.get("/api/")
@app.get("/api/index.py")
async def root():
    return {"status": "ok", "service": "si_sora_api", "version": "1.0.0"}

@app.get("/health")
@app.get("/api/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "service": "ut_sentiment_api", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {str(e)}")
