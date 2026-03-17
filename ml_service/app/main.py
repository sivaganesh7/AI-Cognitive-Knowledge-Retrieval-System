from __future__ import annotations

from fastapi import FastAPI

from app.api.routes.autotag import router as autotag_router
from app.api.routes.health import router as health_router
from app.api.routes.retrieval import router as retrieval_router
from app.api.routes.sentiment import router as sentiment_router
from app.services.model_registry import warmup_models

app = FastAPI(title="AI Cognitive Knowledge Retrieval System ML Service", version="1.1.0")


@app.on_event("startup")
def startup() -> None:
    warmup_models()


app.include_router(health_router)
app.include_router(retrieval_router)
app.include_router(sentiment_router)
app.include_router(autotag_router)

