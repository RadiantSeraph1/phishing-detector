from typing import Literal
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


RiskLevel = Literal["safe", "suspicious", "high"]

FORBIDDEN_SIGNAL_KEYS = {
    "password",
    "password_value",
    "credential",
    "credentials",
    "cookie",
    "cookies",
    "local_storage",
    "session_storage",
    "html",
    "inner_html",
}


class FormSignal(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str | None = None
    action: str | None = None
    method: str | None = None
    field_types: list[str] = Field(default_factory=list)
    submit_text: str | None = None

    @field_validator("field_types")
    @classmethod
    def normalize_field_types(cls, value: list[str]) -> list[str]:
        return [item.lower().strip() for item in value if item.strip()]

    @property
    def action_hostname(self) -> str | None:
        if not self.action:
            return None
        parsed = urlparse(self.action)
        return parsed.hostname.lower() if parsed.hostname else None

    @property
    def has_password_field(self) -> bool:
        return "password" in self.field_types


class PageSignals(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str
    hostname: str
    page_title: str | None = None
    visible_text: list[str] = Field(default_factory=list)
    forms: list[FormSignal] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def reject_sensitive_fields(cls, data: object) -> object:
        if isinstance(data, dict):
            forbidden = FORBIDDEN_SIGNAL_KEYS.intersection({key.lower() for key in data})
            if forbidden:
                names = ", ".join(sorted(forbidden))
                raise ValueError(f"Sensitive fields are not allowed: {names}")
        return data

    @field_validator("hostname")
    @classmethod
    def normalize_hostname(cls, value: str) -> str:
        return value.lower().strip()


class RiskAssessment(BaseModel):
    risk_level: RiskLevel
    score: int = Field(ge=0, le=100)
    reasons: list[str] = Field(default_factory=list)
    source: Literal["rules", "ai", "rules+ai"] = "rules"
    warning_copy: str | None = None
