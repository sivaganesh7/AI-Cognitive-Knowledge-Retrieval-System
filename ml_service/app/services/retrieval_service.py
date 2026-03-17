from __future__ import annotations

from typing import List

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

from app.schemas import NotePayload
from app.services.model_registry import get_embedding_model
from app.services.text_utils import text_from_note


def _top_k_indices(scores: np.ndarray, top_k: int) -> np.ndarray:
    k = min(top_k, scores.shape[0])
    if k <= 0:
        return np.array([], dtype=int)
    if k == scores.shape[0]:
        return np.argsort(scores)[::-1]
    candidate_idx = np.argpartition(scores, -k)[-k:]
    return candidate_idx[np.argsort(scores[candidate_idx])[::-1]]


def rank_notes_by_query(query: str, notes: List[NotePayload], top_k: int) -> List[dict]:
    if not query.strip() or not notes:
        return []

    doc_texts = [text_from_note(note) for note in notes]
    embedder = get_embedding_model()

    if embedder is not None:
        query_vec = embedder.encode(
            [query],
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
        doc_vecs = embedder.encode(
            doc_texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            batch_size=64,
        )
        scores = (doc_vecs @ query_vec.T).reshape(-1)
    else:
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
        doc_matrix = vectorizer.fit_transform(doc_texts)
        query_vec = vectorizer.transform([query])
        scores = (doc_matrix @ query_vec.T).toarray().reshape(-1)

    ranked_indices = _top_k_indices(scores, top_k)

    return [
        {
            "id": notes[idx].id,
            "score": float(scores[idx]),
            "title": notes[idx].title,
            "summary": notes[idx].summary,
            "tags": notes[idx].tags,
            "type": notes[idx].type,
        }
        for idx in ranked_indices.tolist()
    ]


def related_notes(note_id: str, notes: List[NotePayload], top_k: int) -> List[dict]:
    if not notes:
        return []

    target_idx = next((i for i, n in enumerate(notes) if n.id == note_id), None)
    if target_idx is None:
        return []

    doc_texts = [text_from_note(note) for note in notes]
    embedder = get_embedding_model()

    if embedder is not None:
        doc_vecs = embedder.encode(
            doc_texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            batch_size=64,
        )
        target_vec = doc_vecs[target_idx : target_idx + 1]
        scores = (doc_vecs @ target_vec.T).reshape(-1)
    else:
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
        doc_matrix = vectorizer.fit_transform(doc_texts)
        target_vec = doc_matrix[target_idx]
        scores = (doc_matrix @ target_vec.T).toarray().reshape(-1)

    scores[target_idx] = -1.0

    ranked_indices = _top_k_indices(scores, top_k)

    related = []
    for idx in ranked_indices.tolist():
        if scores[idx] < -0.5:
            continue
        note = notes[idx]
        related.append(
            {
                "id": note.id,
                "score": float(scores[idx]),
                "title": note.title,
                "summary": note.summary,
                "tags": note.tags,
                "type": note.type,
            }
        )

    return related
