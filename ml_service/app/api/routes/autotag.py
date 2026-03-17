from __future__ import annotations

from fastapi import APIRouter

from app.schemas import AutoTagRequest
from app.services.autotag_service import classify_tags

router = APIRouter()


@router.post("/autotag")
def autotag(payload: AutoTagRequest):
    return classify_tags(
        title=payload.title,
        content=payload.content,
        candidate_labels=payload.candidate_labels,
        max_tags=payload.max_tags,
    )
