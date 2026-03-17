from __future__ import annotations

from fastapi import APIRouter

from app.schemas import SemanticSearchRequest, SimilarNotesRequest
from app.services.retrieval_service import rank_notes_by_query, related_notes

router = APIRouter()


@router.post("/semantic-search")
def semantic_search(payload: SemanticSearchRequest):
    top_k = max(1, min(payload.top_k, 20))
    matches = rank_notes_by_query(payload.query, payload.notes, top_k)
    return {"matches": matches}


@router.post("/similar-notes")
def similar_notes(payload: SimilarNotesRequest):
    top_k = max(1, min(payload.top_k, 20))
    related = related_notes(payload.note_id, payload.notes, top_k)
    return {"related": related}
