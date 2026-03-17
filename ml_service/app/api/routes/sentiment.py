from __future__ import annotations

from fastapi import APIRouter

from app.schemas import SentimentRequest
from app.services.sentiment_service import analyze_sentiment

router = APIRouter()


@router.post("/sentiment")
def sentiment(payload: SentimentRequest):
    return analyze_sentiment(payload.content)
