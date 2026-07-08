from __future__ import annotations

import os
import json
import time
from uuid import uuid4
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request

# Load .env file explicitly
env_file = Path(__file__).parent.parent / ".env"
load_dotenv(env_file)

from .gemini import VertexAIService
from .schemas import ProductivityRequest, SummaryResponse, TaskSummaryRequest, TaskSummaryResponse

app = FastAPI(title="Todoist AI Agents", version="1.0.0")

allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in allowed_origins else allowed_origins,
    allow_credentials="*" not in allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

vertex_service: VertexAIService | None = None


def get_vertex_service() -> VertexAIService:
    global vertex_service
    if vertex_service is None:
        vertex_service = VertexAIService()
    return vertex_service


@app.middleware("http")
async def request_logging(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid4())
    started_at = time.perf_counter()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        response.headers["x-request-id"] = request_id
        return response
    finally:
        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
        print(
            json.dumps(
                {
                    "requestId": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status": status_code,
                    "durationMs": duration_ms,
                }
            )
        )


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.post("/v1/summaries/productivity", response_model=SummaryResponse)
def productivity_summary(payload: ProductivityRequest):
    try:
        return get_vertex_service().productivity_summary(payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - service boundary
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/v1/summaries/tasks", response_model=TaskSummaryResponse)
def task_summary(payload: TaskSummaryRequest):
    try:
        return get_vertex_service().task_summary(payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - service boundary
        raise HTTPException(status_code=500, detail=str(exc)) from exc
