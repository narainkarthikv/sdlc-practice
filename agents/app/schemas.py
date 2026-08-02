from __future__ import annotations

from datetime import date, timedelta
from typing import Literal

from pydantic import BaseModel, Field


class TaskPayload(BaseModel):
    id: str | None = None
    title: str
    description: str | None = None
    status: Literal["todo", "in_progress", "done"]
    priority: Literal["low", "medium", "high"]
    dueDate: str | None = None


SummaryPeriod = Literal["day", "week", "month", "year"]


def tasks_for_period(tasks: list[TaskPayload], period: SummaryPeriod, today: date | None = None) -> list[TaskPayload]:
    """Return only tasks due in the selected rolling period."""
    start = today or date.today()
    days = {"day": 1, "week": 7, "month": 30, "year": 365}[period]
    end = start + timedelta(days=days - 1)
    scoped_tasks: list[TaskPayload] = []

    for task in tasks:
        if not task.dueDate:
            continue
        try:
            due_date = date.fromisoformat(task.dueDate[:10])
        except ValueError:
            continue
        if start <= due_date <= end:
            scoped_tasks.append(task)

    return scoped_tasks


class ProductivityRequest(BaseModel):
    period: SummaryPeriod = Field(default="day")
    tasks: list[TaskPayload] = Field(default_factory=list)
    context: str | None = None


class TaskSummaryRequest(BaseModel):
    tasks: list[TaskPayload] = Field(default_factory=list)
    applicationContext: str | None = None
    period: SummaryPeriod | None = None


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
