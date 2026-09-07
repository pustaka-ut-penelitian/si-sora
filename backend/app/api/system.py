import os
import time
import uuid
import httpx
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from datetime import datetime, timezone

from app.db.session import get_db
from app.models.models import User, SystemSetting
from app.core.security import get_password_hash
from app.api.auth import require_admin_role

router = APIRouter()

class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    role: str = Field(..., pattern="^(ADMIN|VIEWER)$")

class UpdateUserRequest(BaseModel):
    role: Optional[str] = Field(None, pattern="^(ADMIN|VIEWER)$")
    password: Optional[str] = Field(None, min_length=8)

class UpdateSettingsRequest(BaseModel):
    crawler_api_token: Optional[str] = None
    groq_api_key: Optional[str] = None

class TestGroqRequest(BaseModel):
    api_key: Optional[str] = None

@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin_role)
):
    query = select(User).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()
    
    return {
        "status": "success",
        "data": [
            {
                "id": str(u.id),
                "username": u.username,
                "role": u.role,
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            for u in users
        ]
    }

@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    data: CreateUserRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin_role)
):
    clean_username = data.username.strip()
    
    existing_query = select(User).where(func.lower(User.username) == clean_username.lower())
    existing_res = await db.execute(existing_query)
    if existing_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nama pengguna '{clean_username}' sudah digunakan."
        )
    
    new_user = User(
        username=clean_username,
        password_hash=get_password_hash(data.password),
        role=data.role,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return {
        "status": "success",
        "message": f"Pengguna '{new_user.username}' berhasil didaftarkan.",
        "data": {
            "id": str(new_user.id),
            "username": new_user.username,
            "role": new_user.role,
            "created_at": new_user.created_at.isoformat() if new_user.created_at else None
        }
    }

@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    data: UpdateUserRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin_role)
):
    try:
        target_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format ID pengguna tidak valid."
        )
    
    query = select(User).where(User.id == target_uuid)
    result = await db.execute(query)
    target_user = result.scalar_one_or_none()
    
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pengguna tidak ditemukan."
        )
    
    if data.role and data.role != target_user.role:
        if target_user.role == "ADMIN" and data.role == "VIEWER":
            admin_count_query = select(func.count(User.id)).where(User.role == "ADMIN")
            admin_count_res = await db.execute(admin_count_query)
            admin_count = admin_count_res.scalar() or 0
            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tidak dapat menurunkan peran admin terakhir dalam sistem."
                )
        target_user.role = data.role
    
    if data.password:
        target_user.password_hash = get_password_hash(data.password)
    
    await db.commit()
    await db.refresh(target_user)
    
    return {
        "status": "success",
        "message": f"Data akun '{target_user.username}' berhasil diperbarui.",
        "data": {
            "id": str(target_user.id),
            "username": target_user.username,
            "role": target_user.role,
            "created_at": target_user.created_at.isoformat() if target_user.created_at else None
        }
    }

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin_role)
):
    try:
        target_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format ID pengguna tidak valid."
        )
    
    if target_uuid == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif."
        )
    
    query = select(User).where(User.id == target_uuid)
    result = await db.execute(query)
    target_user = result.scalar_one_or_none()
    
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pengguna tidak ditemukan."
        )
    
    if target_user.role == "ADMIN":
        admin_count_query = select(func.count(User.id)).where(User.role == "ADMIN")
        admin_count_res = await db.execute(admin_count_query)
        admin_count = admin_count_res.scalar() or 0
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tidak dapat menghapus admin terakhir dalam sistem."
            )
    
    await db.delete(target_user)
    await db.commit()
    
    return {
        "status": "success",
        "message": f"Pengguna '{target_user.username}' berhasil dihapus dari sistem."
    }

@router.get("/system/settings")
async def get_system_settings(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin_role)
):
    query = select(SystemSetting)
    result = await db.execute(query)
    settings_records = result.scalars().all()
    
    settings_dict = {s.setting_key: s.setting_value for s in settings_records}
    
    crawler_token = settings_dict.get("crawler_api_token") or os.getenv("APIFY_API_TOKEN") or ""
    groq_key = settings_dict.get("groq_api_key") or os.getenv("GROQ_API_KEY") or ""
    
    return {
        "status": "success",
        "data": {
            "crawler_api_token": crawler_token,
            "groq_api_key": groq_key
        }
    }

@router.post("/system/settings")
async def update_system_settings(
    data: UpdateSettingsRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin_role)
):
    if data.crawler_api_token is not None:
        clean_crawler = data.crawler_api_token.strip()
        query = select(SystemSetting).where(SystemSetting.setting_key == "crawler_api_token")
        res = await db.execute(query)
        record = res.scalar_one_or_none()
        if record:
            record.setting_value = clean_crawler
            record.updated_at = datetime.now(timezone.utc)
        else:
            db.add(SystemSetting(setting_key="crawler_api_token", setting_value=clean_crawler))
        os.environ["APIFY_API_TOKEN"] = clean_crawler
    
    if data.groq_api_key is not None:
        clean_groq = data.groq_api_key.strip()
        query = select(SystemSetting).where(SystemSetting.setting_key == "groq_api_key")
        res = await db.execute(query)
        record = res.scalar_one_or_none()
        if record:
            record.setting_value = clean_groq
            record.updated_at = datetime.now(timezone.utc)
        else:
            db.add(SystemSetting(setting_key="groq_api_key", setting_value=clean_groq))
        os.environ["GROQ_API_KEY"] = clean_groq
        
        try:
            from app.services import ai_engine
            ai_engine.GROQ_API_KEY = clean_groq
            if clean_groq:
                from groq import AsyncGroq
                ai_engine.client = AsyncGroq(api_key=clean_groq)
            else:
                ai_engine.client = None
        except Exception:
            pass
    
    await db.commit()
    
    return {
        "status": "success",
        "message": "Konfigurasi integrasi API berhasil disimpan dan diterapkan."
    }

@router.post("/system/test-groq")
async def test_groq_connection(
    data: TestGroqRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin_role)
):
    target_key = data.api_key.strip() if data.api_key else None
    
    if not target_key:
        query = select(SystemSetting).where(SystemSetting.setting_key == "groq_api_key")
        res = await db.execute(query)
        record = res.scalar_one_or_none()
        if record and record.setting_value:
            target_key = record.setting_value
        else:
            target_key = os.getenv("GROQ_API_KEY")
    
    if not target_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kunci Groq API belum diisi atau dikonfigurasikan."
        )
    
    start_time = time.perf_counter()
    headers = {
        "Authorization": f"Bearer {target_key}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get("https://api.groq.com/openai/v1/models", headers=headers)
            elapsed_sec = time.perf_counter() - start_time
            latency_ms = round(elapsed_sec * 1000)
            
            if resp.status_code == 200:
                payload = resp.json()
                models_data = payload.get("data", [])
                model_ids = [m.get("id") for m in models_data if "id" in m]
                preferred_model = "openai/gpt-oss-20b"
                matched_model = preferred_model if preferred_model in model_ids else (model_ids[0] if model_ids else "active")
                
                return {
                    "status": "success",
                    "message": "Koneksi ke Groq API berhasil dan responsif.",
                    "latency_ms": latency_ms,
                    "model": matched_model,
                    "total_models": len(model_ids)
                }
            elif resp.status_code == 401:
                return {
                    "status": "error",
                    "message": "Kunci API Groq tidak valid atau ditolak oleh server Groq (HTTP 401 Unauthorized)."
                }
            else:
                return {
                    "status": "error",
                    "message": f"Server Groq mengembalikan status HTTP {resp.status_code}: {resp.text[:150]}"
                }
    except httpx.TimeoutException:
        return {
            "status": "error",
            "message": "Permintaan ke Groq API melebihi batas waktu (Timeout > 6 detik)."
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Gagal menghubungi server Groq: {str(e)}"
        }
