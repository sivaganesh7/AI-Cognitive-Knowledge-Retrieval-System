from __future__ import annotations

import re

from app.core.config import config
from app.services.model_registry import get_sentiment_model

POSITIVE_WORDS = {
    "good",
    "great",
    "excellent",
    "happy",
    "love",
    "win",
    "progress",
    "clear",
    "excited",
    "productive",
}

NEGATIVE_WORDS = {
    "bad",
    "worse",
    "worst",
    "sad",
    "angry",
    "hate",
    "stuck",
    "blocked",
    "confused",
    "frustrated",
}


def _lexicon_sentiment(text: str) -> dict:
    tokens = re.findall(r"[a-zA-Z]+", text.lower())
    if not tokens:
        return {
            "sentiment": "neutral",
            "confidence": 0.5,
            "emotions": ["reflective"],
            "tone": "neutral",
        }

    pos = sum(1 for token in tokens if token in POSITIVE_WORDS)
    neg = sum(1 for token in tokens if token in NEGATIVE_WORDS)
    total_hits = pos + neg

    if total_hits == 0 or pos == neg:
        label = "neutral"
        confidence = 0.5
    elif pos > neg:
        label = "positive"
        confidence = min(0.9, 0.55 + (pos - neg) / max(len(tokens), 1))
    else:
        label = "negative"
        confidence = min(0.9, 0.55 + (neg - pos) / max(len(tokens), 1))

    emotions = {
        "positive": ["optimistic", "engaged"],
        "negative": ["frustrated", "concerned"],
        "neutral": ["reflective"],
    }[label]

    return {
        "sentiment": label,
        "confidence": float(confidence),
        "emotions": emotions,
        "tone": label,
    }


def analyze_sentiment(content: str) -> dict:
    text = content.strip()
    if not text:
        return {
            "sentiment": "neutral",
            "confidence": 0.5,
            "emotions": ["reflective"],
            "tone": "neutral",
        }

    model = get_sentiment_model()
    if model is None:
        return _lexicon_sentiment(text)

    result = model(text[: config.max_query_chars])[0]

    label = str(result.get("label", "NEUTRAL")).upper()
    score = float(result.get("score", 0.5))

    if "POS" in label:
        sentiment_label = "positive"
    elif "NEG" in label:
        sentiment_label = "negative"
    else:
        sentiment_label = "neutral"

    emotions = {
        "positive": ["optimistic", "engaged"],
        "negative": ["frustrated", "concerned"],
        "neutral": ["reflective"],
    }[sentiment_label]

    return {
        "sentiment": sentiment_label,
        "confidence": score,
        "emotions": emotions,
        "tone": sentiment_label,
    }
