"""Tokenizer par mot du carnet. Doit rester identique à lib/carnet/tokenize.ts."""

import re
import unicodedata

WORD = re.compile(r"[a-z0-9]+")


def fold_text(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text)
    return "".join(c for c in decomposed if not unicodedata.category(c).startswith("M")).lower()


def tokenize(text: str) -> list[str]:
    return [w for w in WORD.findall(fold_text(text)) if len(w) >= 2]
