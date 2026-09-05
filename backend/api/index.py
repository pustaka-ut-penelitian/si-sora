import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app as fastapi_app

async def app(scope, receive, send):
    if scope.get("type") == "http" and scope.get("path") == "/api/index.py":
        scope["path"] = "/"
        scope["raw_path"] = b"/"
    await fastapi_app(scope, receive, send)
