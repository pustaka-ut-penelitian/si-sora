import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app as fastapi_app

async def app(scope, receive, send):
    if scope.get("type") == "http":
        headers = dict(scope.get("headers", []))
        matched_path = headers.get(b"x-matched-path", b"").decode("utf-8")
        forwarded_uri = headers.get(b"x-forwarded-uri", b"").decode("utf-8")
        real_path = forwarded_uri or matched_path
        if real_path and real_path != "/api/index.py":
            scope["path"] = real_path
            scope["raw_path"] = real_path.encode("utf-8")
        elif scope.get("path") == "/api/index.py":
            scope["path"] = "/"
            scope["raw_path"] = b"/"
    await fastapi_app(scope, receive, send)
