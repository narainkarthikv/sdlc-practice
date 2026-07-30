from __future__ import annotations

import os

from fastapi import HTTPException, Request, status
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2 import id_token

_google_request = GoogleAuthRequest()


def _is_truthy(value: str | None) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


def _is_falsey(value: str | None) -> bool:
    return str(value or "").strip().lower() in {"0", "false", "no", "off"}


def should_require_service_auth() -> bool:
    flag = os.getenv("SERVICE_TO_SERVICE_AUTH")
    if flag and _is_falsey(flag):
        return False
    if flag and _is_truthy(flag):
        return True
    return bool(os.getenv("K_SERVICE"))


def expected_audience(request: Request) -> str | None:
    forwarded_proto = request.headers.get("x-forwarded-proto")
    protocol = (forwarded_proto.split(",")[0].strip() if forwarded_proto else request.url.scheme) or "http"
    host = request.headers.get("host")
    if not host:
        return None
    return f"{protocol}://{host.split(',')[0].strip()}"


def require_service_caller(request: Request) -> None:
    if not should_require_service_auth() or request.url.path == "/healthz":
        return

    authorization = request.headers.get("authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing service identity",
        )

    audience = expected_audience(request)
    if not audience:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing service audience",
        )

    try:
        id_token.verify_oauth2_token(token.strip(), _google_request, audience=audience)
    except Exception as exc:  # pragma: no cover - service boundary
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid service identity",
        ) from exc
