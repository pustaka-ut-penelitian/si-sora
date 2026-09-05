import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app as fastapi_app

async def app(scope, receive, send):
    if scope.get("type") == "http":
        headers = dict(scope.get("headers", []))
        matched_path = headers.get(b"x-matched-path", b"").decode("utf-8")
        if matched_path:
            scope["path"] = matched_path
            scope["raw_path"] = matched_path.encode("utf-8")
        elif scope.get("path") == "/api/index.py":
            scope["path"] = "/"
            scope["raw_path"] = b"/"
    await fastapi_app(scope, receive, send)
