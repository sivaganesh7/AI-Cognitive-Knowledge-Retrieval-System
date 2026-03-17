from __future__ import annotations

import os

from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()


class ModelConfig(BaseModel):
    embedding_model_name: str = os.getenv("ML_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    sentiment_model_name: str = os.getenv("ML_SENTIMENT_MODEL", "distilbert/distilbert-base-uncased-finetuned-sst-2-english")
    zero_shot_model_name: str = os.getenv("ML_ZERO_SHOT_MODEL", "typeform/distilbert-base-uncased-mnli")
    max_query_chars: int = int(os.getenv("ML_MAX_QUERY_CHARS", "1200"))
    max_autotag_chars: int = int(os.getenv("ML_MAX_AUTOTAG_CHARS", "2500"))


config = ModelConfig()
