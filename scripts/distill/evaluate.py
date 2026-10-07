"""Accord élève/professeur (taux de succès à 3), taille compressée et temps 4G estimé."""

import gzip
import json
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

from carnet_static import embed_tokens, load_student
from carnet_text import tokenize

HERE = Path(__file__).parent
MODEL_DIR = HERE.parents[1] / "public" / "models" / "carnet-static"
FAST_4G_BYTES_PER_S = 9e6 / 8  # 9 Mbit/s
RTT_S = 0.15
FILES = ["meta.json", "vocab.json", "vectors.i8", "scales.f32"]


def main() -> None:
    corpus = json.loads((HERE / "corpus.json").read_text())
    queries = json.loads((HERE / "queries.json").read_text())
    docs = [item["text"] for item in corpus]

    teacher = SentenceTransformer("lightonai/mDenseOn")
    td = teacher.encode(docs, prompt_name="document", normalize_embeddings=True)
    tq = teacher.encode([q["q"] for q in queries], prompt_name="query", normalize_embeddings=True)
    teacher_top = np.argsort(-(tq @ td.T), axis=1)

    meta, vocab, q8, scales = load_student(MODEL_DIR)
    zero = np.zeros(meta["dim"])
    doc_vectors = [embed_tokens(tokenize(t), vocab, q8, scales) for t in docs]
    sd = np.stack([zero if v is None else v for v in doc_vectors])
    per_query, hits, overlaps = [], [], []
    for i, query in enumerate(queries):
        sv = embed_tokens(tokenize(query["q"]), vocab, q8, scales)
        student_top3 = [] if sv is None else list(np.argsort(-(sd @ sv))[:3])
        teacher_top3 = list(teacher_top[i][:3])
        hit = int(teacher_top[i][0] in student_top3)
        hits.append(hit)
        overlaps.append(len(set(student_top3) & set(teacher_top3)) / 3)
        per_query.append({
            "q": query["q"], "lang": query["lang"], "hit": hit,
            "teacher": [corpus[j]["id"] for j in teacher_top3],
            "student": [corpus[j]["id"] for j in student_top3],
        })

    gzip_bytes = sum(len(gzip.compress((MODEL_DIR / f).read_bytes(), 9)) for f in FILES)
    report = {
        "hitAt3": float(np.mean(hits)), "overlapAt3": float(np.mean(overlaps)),
        "queries": len(queries), "gzipBytes": gzip_bytes,
        "est4gSeconds": round(gzip_bytes / FAST_4G_BYTES_PER_S + RTT_S, 2),
        "perQuery": per_query,
    }
    (HERE / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(f"hit@3={report['hitAt3']:.2f}  overlap@3={report['overlapAt3']:.2f}  "
          f"gzip={gzip_bytes / 1e6:.1f} Mo  4G≈{report['est4gSeconds']} s")


if __name__ == "__main__":
    main()
