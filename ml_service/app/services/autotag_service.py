from __future__ import annotations

import re
from typing import List

from app.core.config import config
from app.services.model_registry import get_zero_shot_model
from app.services.text_utils import dedupe_labels


def default_candidate_labels() -> List[str]:
    return [
        "ai",
        "machine learning",
        "deep learning",
        "nlp",
        "research",
        "productivity",
        "programming",
        "backend",
        "frontend",
        "database",
        "system design",
        "career",
        "health",
        "finance",
        "study",
        "writing",
    ]


def classify_tags(title: str, content: str, candidate_labels: List[str], max_tags: int) -> dict:
    text = f"{title}\n{content}".strip()
    if not text:
        return {"tags": []}

    labels = dedupe_labels(candidate_labels or default_candidate_labels())
    if not labels:
        return {"tags": []}

    max_tags = max(1, min(max_tags, 8))
    clf = get_zero_shot_model()
    if clf is None:
        tokens = set(re.findall(r"[a-zA-Z]+", text.lower()))
        scored = []
        for label in labels:
            label_tokens = set(re.findall(r"[a-zA-Z]+", label.lower()))
            if not label_tokens:
                continue
            overlap = len(tokens & label_tokens)
            if overlap > 0:
                scored.append((label, overlap / len(label_tokens)))

        scored.sort(key=lambda item: item[1], reverse=True)
        return {"tags": [label for label, _ in scored[:max_tags]]}

    out = clf(
        sequences=text[: config.max_autotag_chars],
        candidate_labels=labels,
        multi_label=True,
    )

    pairs = sorted(zip(out["labels"], out["scores"]), key=lambda x: x[1], reverse=True)
    tags = [label for label, score in pairs if float(score) >= 0.25][:max_tags]
    return {"tags": tags}
