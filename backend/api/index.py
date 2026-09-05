import sys
import os
from urllib.parse import parse_qs, urlencode

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app as fastapi_app

async def app(scope, receive, send):
    if scope.get("type") == "http":
        qs = scope.get("query_string", b"").decode("utf-8")
        if "__path" in qs:
            params = parse_qs(qs, keep_blank_values=True)
            if "__path" in params and params["__path"]:
                new_path = params.pop("__path")[0]
                if not new_path.startswith("/"):
                    new_path = "/" + new_path
                scope["path"] = new_path
                scope["raw_path"] = new_path.encode("utf-8")
                scope["query_string"] = urlencode(params, doseq=True).encode("utf-8")
        elif scope.get("path") == "/api/index.py":
            scope["path"] = "/"
            scope["raw_path"] = b"/"
    await fastapi_app(scope, receive, send)
