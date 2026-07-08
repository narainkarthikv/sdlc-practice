from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class TaskPayload(BaseModel):
    id: str | None = None
    title: str
    description: str | None = None
    status: Literal["todo", "in_progress", "done"]
    priority: Literal["low", "medium", "high"]
    dueDate: str | None = None


class ProductivityRequest(BaseModel):
    period: Literal["day", "week", "month", "year"] = Field(default="day")
    tasks: list[TaskPayload] = Field(default_factory=list)
    context: str | None = None


class TaskSummaryRequest(BaseModel):
    tasks: list[TaskPayload] = Field(default_factory=list)
    applicationContext: str | None = None


class SummaryResponse(BaseModel):
    summary: str
    highlights: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    nextSteps: list[str] = Field(default_factory=list)


class TaskSummaryResponse(BaseModel):
    summary: str
    breakdown: dict[str, int]
    blockers: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)

