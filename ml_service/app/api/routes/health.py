from __future__ import annotations

from fastapi import APIRouter

from app.core.config import config
from app.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        embedding_model=config.embedding_model_name,
        sentiment_model=config.sentiment_model_name,
        zero_shot_model=config.zero_shot_model_name,
    )
