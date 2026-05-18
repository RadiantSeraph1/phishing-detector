import json
import os
from typing import Any

import httpx

from app.models import PageSignals, RiskAssessment


OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
DEFAULT_MODEL = "gpt-5.4-mini"


class OpenAIAnalyzer:
    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key if api_key is not None else os.getenv("OPENAI_API_KEY")
        self.model = model or os.getenv("OPENAI_MODEL", DEFAULT_MODEL)

    async def analyze(self, signals: PageSignals) -> RiskAssessment | None:
        if not self.api_key:
            return None

        payload = {
            "model": self.model,
            "input": [
                {
                    "role": "system",
                    "content": (
                        "You classify phishing risk from sanitized browser page signals. "
                        "Never ask for credentials. Return concise user-facing reasons."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(signals.model_dump(), ensure_ascii=True),
                },
            ],
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "phishing_risk_assessment",
                    "schema": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "risk_level": {
                                "type": "string",
                                "enum": ["safe", "suspicious", "high"],
                            },
                            "score": {"type": "integer", "minimum": 0, "maximum": 100},
                            "reasons": {
                                "type": "array",
                                "items": {"type": "string"},
                                "maxItems": 5,
                            },
                            "warning_copy": {"type": "string"},
                        },
                        "required": ["risk_level", "score", "reasons", "warning_copy"],
                    },
                    "strict": True,
                }
            },
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post(
                    OPENAI_RESPONSES_URL,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                response.raise_for_status()
        except httpx.HTTPError:
            return None

        return _parse_response(response.json())


def combine_assessments(rule_result: RiskAssessment, ai_result: RiskAssessment | None) -> RiskAssessment:
    if ai_result is None:
        return rule_result

    score = max(rule_result.score, ai_result.score)
    risk_level = _stronger_level(rule_result.risk_level, ai_result.risk_level)
    reasons = _dedupe([*rule_result.reasons, *ai_result.reasons])
    return RiskAssessment(
        risk_level=risk_level,
        score=score,
        reasons=reasons[:6],
        source="rules+ai",
        warning_copy=ai_result.warning_copy or rule_result.warning_copy,
    )


def _parse_response(body: dict[str, Any]) -> RiskAssessment | None:
    try:
        text = body["output"][0]["content"][0]["text"]
        data = json.loads(text)
        return RiskAssessment(
            risk_level=data["risk_level"],
            score=data["score"],
            reasons=data.get("reasons", []),
            source="ai",
            warning_copy=data.get("warning_copy"),
        )
    except (KeyError, TypeError, ValueError, IndexError):
        return None


def _stronger_level(first: str, second: str) -> str:
    order = {"safe": 0, "suspicious": 1, "high": 2}
    return first if order[first] >= order[second] else second


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            result.append(value)
    return result
