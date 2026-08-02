from __future__ import annotations

import json
import os
import re
from typing import Any

import vertexai
from vertexai.generative_models import GenerativeModel

from .schemas import (
    ProductivityRequest,
    SummaryResponse,
    TaskSummaryRequest,
    TaskSummaryResponse,
    tasks_for_period,
)

SYSTEM_PROMPT = """
You write task summaries for busy people, not software engineers.
Always use simple, everyday language that a non-technical person can understand.
Use short sentences and explain what the work means in practical terms.
Avoid technical, corporate, management, and AI jargon. Do not use words such as
"bottleneck", "bandwidth", "throughput", "delivery risk", "optimization", or
"blocker" unless you immediately explain them in plain words.
Focus on what was done, what needs attention, and what the person should do next.
Be specific and helpful, but do not invent information that is not in the tasks.
Return only the JSON format requested by the user prompt.
"""


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


def _string_list(value: Any) -> list[str]:
    """Keep model list fields compatible when Gemini returns rich objects."""
    if not isinstance(value, list):
        return []

    result: list[str] = []
    preferred_keys = ("recommendation", "action", "rationale", "description", "message", "text")
    for item in value:
        if isinstance(item, str):
            result.append(item)
            continue

        if isinstance(item, dict):
            text = next(
                (item[key] for key in preferred_keys if isinstance(item.get(key), str)),
                None,
            )
            if text:
                result.append(text)
                continue

        result.append(str(item))

    return result


class VertexAIService:
    def __init__(self) -> None:
        project_id = (
            os.getenv("GCP_PROJECT_ID")
            or os.getenv("GOOGLE_CLOUD_PROJECT")
            or os.getenv("GCLOUD_PROJECT")
        )
        region = os.getenv("GCP_REGION", "us-central1")
        model_name = os.getenv("VERTEX_MODEL", "gemini-1.5-flash-001")
        
        if not project_id:
            raise RuntimeError("GCP_PROJECT_ID or GOOGLE_CLOUD_PROJECT is required")
        
        # Initialize Vertex AI with ADC (Application Default Credentials)
        vertexai.init(project=project_id, location=region)
        self.model = GenerativeModel(
            model_name,
            system_instruction=SYSTEM_PROMPT,
        )

    def productivity_summary(self, payload: ProductivityRequest) -> SummaryResponse:
        tasks = tasks_for_period(payload.tasks, payload.period)
        tasks_json = json.dumps([task.model_dump() for task in tasks], indent=2)
        prompt = f"""
You are a senior productivity analyst.
Summarize the following work for the {payload.period} period.
Return strict JSON with keys: summary, highlights, risks, nextSteps.
Use simple words and short sentences. Write for a person who does not work in
technology. Say what the tasks mean in everyday terms. Each list must contain
short, useful strings. Do not mention the JSON format in any returned value.

Context:
{payload.context or "No additional context provided."}

Tasks due in the selected period:
{tasks_json}
"""
        response = self.model.generate_content(prompt)
        data = _extract_json(response.text or "{}")
        return SummaryResponse(
            summary=data.get("summary", ""),
            highlights=_string_list(data.get("highlights", [])),
            risks=_string_list(data.get("risks", [])),
            nextSteps=_string_list(data.get("nextSteps", [])),
        )

    def task_summary(self, payload: TaskSummaryRequest) -> TaskSummaryResponse:
        scoped_tasks = (
            tasks_for_period(payload.tasks, payload.period)
            if payload.period
            else payload.tasks
        )
        tasks = [task.model_dump() for task in scoped_tasks]
        breakdown = {
            "todo": sum(1 for task in tasks if task["status"] == "todo"),
            "in_progress": sum(1 for task in tasks if task["status"] == "in_progress"),
            "done": sum(1 for task in tasks if task["status"] == "done"),
        }
        prompt = f"""
You are a delivery analyst reviewing application tasks.
Return strict JSON with keys: summary, blockers, recommendations.
Describe the current work in simple everyday language. Explain what needs
attention and what the person should do next. Do not use technical or corporate
jargon. Both blockers and recommendations must be arrays of short plain-text
strings, never objects.

Context:
{payload.applicationContext or "No application context provided."}

Tasks{f' due in the selected {payload.period} period' if payload.period else ''}:
{json.dumps(tasks, indent=2)}
"""
        response = self.model.generate_content(prompt)
        data = _extract_json(response.text or "{}")
        return TaskSummaryResponse(
            summary=data.get("summary", ""),
            breakdown=breakdown,
            blockers=_string_list(data.get("blockers", [])),
            recommendations=_string_list(data.get("recommendations", [])),
        )
