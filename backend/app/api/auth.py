from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import jwt
from jwt.exceptions import ExpiredSignatureError, PyJWTError

from app.db.session import get_db
from app.models.models import User
from app.core.security import verify_password, create_access_token, SECRET_KEY, ALGORITHM

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Tidak dapat memvalidasi kredensial (Token kadaluwarsa atau tidak sah).",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sudah kadaluwarsa. Silakan login kembali.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except PyJWTError:
        raise credentials_exception

    query = select(User).where(User.username == username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    return user

async def require_admin_role(current_user: User = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hak akses ditolak. Hanya ADMIN yang diizinkan."
        )
    return current_user

@router.post("/login")
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    username = None
    password = None

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            username = body.get("username")
            password = body.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Format JSON tidak valid."
            )
    else:
        try:
            form = await request.form()
            username = form.get("username")
            password = form.get("password")
        except Exception:
            pass

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nama pengguna dan kata sandi wajib diisi."
        )

    clean_username = str(username).strip()
    query = select(User).where(User.username == clean_username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(str(password), user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau sandi salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "status": "success",
        "data": {
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role,
            "created_at": current_user.created_at
        }
    }
