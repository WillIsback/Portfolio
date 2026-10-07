"""Vocabulaire du modèle statique : mots du corpus d'abord, puis mots courants FR et EN."""

import argparse
import json
from pathlib import Path

from wordfreq import top_n_list

from carnet_text import tokenize


def build_vocabulary(corpus_texts, common_fr, common_en) -> list[str]:
    seen: dict[str, None] = {}
    for text in [*corpus_texts, *common_fr, *common_en]:
        for word in tokenize(text):
            seen.setdefault(word, None)
    return list(seen)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--corpus", default="corpus.json")
    parser.add_argument("--common", type=int, default=20000)
    parser.add_argument("--out", default="vocab.txt")
    args = parser.parse_args()
    corpus = json.loads(Path(args.corpus).read_text())
    vocab = build_vocabulary(
        [item["text"] for item in corpus],
        top_n_list("fr", args.common),
        top_n_list("en", args.common),
    )
    Path(args.out).write_text("\n".join(vocab) + "\n")
    print(f"{len(vocab)} mots -> {args.out}")


if __name__ == "__main__":
    main()
