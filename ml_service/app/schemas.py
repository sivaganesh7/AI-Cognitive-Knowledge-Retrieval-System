from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    embedding_model: str
    sentiment_model: str
    zero_shot_model: str


class NotePayload(BaseModel):
    id: str
    title: str = ""
    content: str = ""
    summary: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    type: Optional[str] = None


class SimilarityNoteResponse(BaseModel):
    id: str
    score: float
    title: str
    summary: Optional[str]
    tags: List[str]
    type: Optional[str]


class SemanticSearchRequest(BaseModel):
    query: str
    notes: List[NotePayload]
    top_k: int = 5


class SimilarNotesRequest(BaseModel):
    note_id: str
    notes: List[NotePayload]
    top_k: int = 3


class SentimentRequest(BaseModel):
    content: str


class AutoTagRequest(BaseModel):
    title: str = ""
    content: str
    candidate_labels: List[str] = Field(default_factory=list)
    max_tags: int = 5
