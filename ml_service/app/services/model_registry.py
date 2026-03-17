from __future__ import annotations

import importlib
from functools import lru_cache
from typing import Any

try:
    from transformers import pipeline
except Exception:  # pragma: no cover - import fallback
    pipeline = None

from app.core.config import config


@lru_cache(maxsize=1)
def get_embedding_model():
    try:
        module: Any = importlib.import_module("sentence_transformers")
    except Exception:
        return None

    try:
        return module.SentenceTransformer(config.embedding_model_name)
    except Exception:
        return None


@lru_cache(maxsize=1)
def get_sentiment_model():
    if pipeline is None:
        return None
    try:
        return pipeline(
            "sentiment-analysis",
            model=config.sentiment_model_name,
            tokenizer=config.sentiment_model_name,
        )
    except Exception:
        return None


@lru_cache(maxsize=1)
def get_zero_shot_model():
    if pipeline is None:
        return None
    try:
        return pipeline(
            "zero-shot-classification",
            model=config.zero_shot_model_name,
            tokenizer=config.zero_shot_model_name,
        )
    except Exception:
        return None


def warmup_models() -> None:
    # Preload models once to reduce first-request latency spikes.
    get_embedding_model()
    get_sentiment_model()
    get_zero_shot_model()
