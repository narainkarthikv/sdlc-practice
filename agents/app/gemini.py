from __future__ import annotations

import json
import os
import re
from typing import Any

import vertexai
from vertexai.generative_models import GenerativeModel

from .schemas import ProductivityRequest, SummaryResponse, TaskSummaryRequest, TaskSummaryResponse


def _extract_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        match = re.search(r"```(?:json)?\s*(.*?)```", cleaned, re.DOTALL)
        if match:
            cleaned = match.group(1).strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("Model response did not contain JSON")
    return json.loads(cleaned[start : end + 1])


class VertexAIService:
    def __init__(self) -> None:
        project_id = os.getenv("GCP_PROJECT_ID")
        region = os.getenv("GCP_REGION", "us-central1")
        model_name = os.getenv("VERTEX_MODEL", "gemini-1.5-flash-001")
        
        if not project_id:
            raise RuntimeError("GCP_PROJECT_ID is required")
        
        # Initialize Vertex AI with ADC (Application Default Credentials)
        vertexai.init(project=project_id, location=region)
        self.model = GenerativeModel(model_name)

    def productivity_summary(self, payload: ProductivityRequest) -> SummaryResponse:
        tasks_json = json.dumps([task.model_dump() for task in payload.tasks], indent=2)
        prompt = f"""
You are a senior productivity analyst.
Summarize the following work for the {payload.period} period.
Return strict JSON with keys: summary, highlights, risks, nextSteps.
Each list must contain short actionable strings.

Context:
{payload.context or "No additional context provided."}

Tasks:
{tasks_json}
"""
        response = self.model.generate_content(prompt)
        data = _extract_json(response.text or "{}")
        return SummaryResponse(
            summary=data.get("summary", ""),
            highlights=list(data.get("highlights", [])),
            risks=list(data.get("risks", [])),
            nextSteps=list(data.get("nextSteps", [])),
        )

    def task_summary(self, payload: TaskSummaryRequest) -> TaskSummaryResponse:
        tasks = [task.model_dump() for task in payload.tasks]
        breakdown = {
            "todo": sum(1 for task in tasks if task["status"] == "todo"),
            "in_progress": sum(1 for task in tasks if task["status"] == "in_progress"),
            "done": sum(1 for task in tasks if task["status"] == "done"),
        }
        prompt = f"""
You are a delivery analyst reviewing application tasks.
Return strict JSON with keys: summary, blockers, recommendations.
Focus on work distribution, overdue risk, and delivery bottlenecks.

Context:
{payload.applicationContext or "No application context provided."}

Tasks:
{json.dumps(tasks, indent=2)}
"""
        response = self.model.generate_content(prompt)
        data = _extract_json(response.text or "{}")
        return TaskSummaryResponse(
            summary=data.get("summary", ""),
            breakdown=breakdown,
            blockers=list(data.get("blockers", [])),
            recommendations=list(data.get("recommendations", [])),
        )

