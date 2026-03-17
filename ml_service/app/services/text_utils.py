from __future__ import annotations

from collections import OrderedDict
from typing import Iterable, List

from app.schemas import NotePayload


def text_from_note(note: NotePayload) -> str:
    tags_text = " ".join(note.tags or [])
    summary = note.summary or ""
    return f"{note.title}\n{summary}\n{note.content}\n{tags_text}\n{note.type or ''}".strip()


def dedupe_labels(labels: Iterable[str]) -> List[str]:
    cleaned = [label.strip().lower() for label in labels if label and label.strip()]
    return list(OrderedDict.fromkeys(cleaned))
