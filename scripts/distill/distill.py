"""Distille lightonai/mDenseOn en embeddings statiques par mot (méthode model2vec, implémentée directement)."""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer
from wordfreq import word_frequency

from carnet_static import embed_tokens, quantize_rows
from carnet_text import tokenize

TEACHER = "lightonai/mDenseOn"
ROOT = Path(__file__).resolve().parents[2]


def sif_weights(words: list[str], a: float) -> np.ndarray:
    freqs = np.array(
        [max(word_frequency(w, "fr"), word_frequency(w, "en")) for w in words], dtype=np.float64
    )
    return a / (a + freqs)


def pca(x: np.ndarray, dims: int) -> np.ndarray:
    centered = x - x.mean(axis=0)
    _, _, vt = np.linalg.svd(centered, full_matrices=False)
    return centered @ vt[:dims].T


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--vocab", default="vocab.txt")
    parser.add_argument("--dims", type=int, default=128)
    parser.add_argument("--word-prompt", choices=["none", "query", "document"], default="none")
    parser.add_argument("--sif-a", type=float, default=1e-4)
    parser.add_argument("--batch", type=int, default=512)
    parser.add_argument("--device", default=None)
    parser.add_argument("--limit", type=int, default=None, help="chronométrer sur les N premiers mots (aucun fichier écrit)")
    parser.add_argument("--out", default=str(ROOT / "public" / "models" / "carnet-static"))
    args = parser.parse_args()

    words = Path(args.vocab).read_text().split()
    if args.limit:
        import time
        model = SentenceTransformer(TEACHER, device=args.device)
        start = time.perf_counter()
        model.encode(words[: args.limit], batch_size=args.batch, convert_to_numpy=True)
        per_word = (time.perf_counter() - start) / args.limit
        print(f"{per_word * 1000:.2f} ms/mot -> estimation {per_word * len(words) / 60:.1f} min pour {len(words)} mots")
        return
    model = SentenceTransformer(TEACHER, device=args.device)
    kwargs = {} if args.word_prompt == "none" else {"prompt_name": args.word_prompt}
    emb = model.encode(
        words, batch_size=args.batch, normalize_embeddings=True,
        convert_to_numpy=True, show_progress_bar=True, **kwargs,
    ).astype(np.float64)

    reduced = pca(emb, args.dims) * sif_weights(words, args.sif_a)[:, None]
    q, scales = quantize_rows(reduced)

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    q.tofile(out / "vectors.i8")
    scales.astype("<f4").tofile(out / "scales.f32")
    (out / "vocab.json").write_text(json.dumps(words, ensure_ascii=False))
    digest = hashlib.sha256(q.tobytes() + scales.tobytes()).hexdigest()[:12]
    meta = {
        "version": digest, "teacher": TEACHER, "dim": args.dims, "vocabSize": len(words),
        "wordPrompt": args.word_prompt, "sifA": args.sif_a,
    }
    (out / "meta.json").write_text(json.dumps(meta, indent=2) + "\n")

    vocab = {w: i for i, w in enumerate(words)}
    golden = []
    for text in json.loads((Path(__file__).parent / "golden_texts.json").read_text()):
        tokens = tokenize(text)
        v = embed_tokens(tokens, vocab, q, scales)
        golden.append({"text": text, "tokens": tokens, "embedding": None if v is None else v.round(6).tolist()})
    fixture = ROOT / "lib" / "carnet" / "__fixtures__" / "golden.json"
    fixture.parent.mkdir(parents=True, exist_ok=True)
    fixture.write_text(json.dumps(golden, ensure_ascii=False, indent=1) + "\n")
    print(f"modèle {digest} : {len(words)} mots × {args.dims} dims -> {out}")


if __name__ == "__main__":
    main()
