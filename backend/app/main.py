from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import PageSignals, RiskAssessment
from app.openai_client import OpenAIAnalyzer, combine_assessments
from app.rules import score_page


load_dotenv(".env.local")

app = FastAPI(title="PhishShield API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=RiskAssessment)
async def analyze(signals: PageSignals) -> RiskAssessment:
    rule_result = score_page(signals)
    ai_result = await OpenAIAnalyzer().analyze(signals)
    return combine_assessments(rule_result, ai_result)
