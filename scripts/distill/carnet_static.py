"""Format du modèle statique du carnet : quantification int8 par ligne et embedding moyen."""

import json
from pathlib import Path

import numpy as np


def quantize_rows(m: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    scales = np.abs(m).max(axis=1) / 127.0
    scales[scales == 0] = 1.0
    q = np.clip(np.rint(m / scales[:, None]), -127, 127).astype(np.int8)
    return q, scales.astype(np.float32)


def dequantize(q: np.ndarray, scales: np.ndarray) -> np.ndarray:
    return q.astype(np.float64) * scales.astype(np.float64)[:, None]


def embed_tokens(tokens, vocab: dict[str, int], q: np.ndarray, scales: np.ndarray):
    ids = [vocab[t] for t in tokens if t in vocab]
    if not ids:
        return None
    v = dequantize(q[ids], scales[ids]).mean(axis=0)
    norm = np.linalg.norm(v)
    return None if norm == 0 else v / norm


def load_student(directory: Path):
    meta = json.loads((directory / "meta.json").read_text())
    words = json.loads((directory / "vocab.json").read_text())
    dim, size = meta["dim"], meta["vocabSize"]
    q = np.fromfile(directory / "vectors.i8", dtype=np.int8).reshape(size, dim)
    scales = np.fromfile(directory / "scales.f32", dtype="<f4")
    return meta, {w: i for i, w in enumerate(words)}, q, scales
