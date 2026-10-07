import numpy as np

from carnet_static import dequantize, embed_tokens, quantize_rows
from carnet_text import tokenize
from build_vocab import build_vocabulary


def test_tokenize_matches_typescript_contract():
    assert tokenize("Évaluation d'IA : COMPUTER Vision, à 2 mains") == [
        "evaluation", "ia", "computer", "vision", "mains",
    ]
    assert tokenize("🤖 ! ?") == []


def test_quantize_roundtrip_is_close():
    rng = np.random.default_rng(0)
    m = rng.normal(size=(50, 16)).astype(np.float64)
    q, scales = quantize_rows(m)
    assert q.dtype == np.int8 and scales.dtype == np.float32
    back = dequantize(q, scales)
    err = np.abs(back - m).max(axis=1) / np.abs(m).max(axis=1)
    assert err.max() < 0.005


def test_quantize_zero_row_is_safe():
    q, scales = quantize_rows(np.zeros((2, 4)))
    assert np.all(q == 0) and np.all(scales == 1.0)


def test_embed_tokens_mean_normalized_and_none_when_unknown():
    vocab = {"vision": 0, "agents": 1}
    q, scales = quantize_rows(np.array([[1.0, 0.0], [0.0, 1.0]]))
    v = embed_tokens(["vision", "agents", "inconnu"], vocab, q, scales)
    assert np.allclose(v, [2 ** -0.5, 2 ** -0.5], atol=1e-3)
    assert embed_tokens(["inconnu"], vocab, q, scales) is None


def test_build_vocabulary_keeps_corpus_first_and_dedups():
    vocab = build_vocabulary(["Vision par ordinateur", "vision"], ["le", "vision"], ["the"])
    assert vocab == ["vision", "par", "ordinateur", "le", "the"]
