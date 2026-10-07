# Portfolio V2 — L0 (mesure et distillation) et L1 (identité) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produire le modèle d'embeddings statique distillé de mDenseOn et la carte `content/map.json` avec une décision chiffrée (L0), et poser l'identité visuelle « carnet de labo » sur tout le site sans changer sa structure (L1).

**Architecture:** L0 : un export du corpus (TypeScript, base + MDX) alimente un pipeline Python exécuté une fois (distillation par mot, PCA, pondération SIF, quantification int8) qui publie des fichiers statiques dans `public/models/carnet-static/` ; un runtime TypeScript identique au calcul Python (test de parité) calcule les embeddings et construit la carte (UMAP + k-means, graine fixée). L1 : nouvelles polices via `next/font`, nouveaux tokens de couleur, grille de papier, primitives d'animation (tracé d'encre, note de marge, légende de figure), en-tête fin et pied de page colophon.

**Tech Stack:** Next.js 16.1.4, React 19.2.3, Tailwind CSS 4, framer-motion 12, zod 4, vitest 4, tsx, pnpm, biome ; Python 3.11 avec uv, sentence-transformers 5.4.1, transformers 5.6.2, numpy, wordfreq.

**Spec:** `docs/superpowers/specs/2026-10-07-portfolio-v2-carnet-de-labo-design.md`

**Portée.** Ce plan couvre L0 et L1 uniquement. L2 (Fig. 1), L3 (reste de l'accueil) et L4 (articles, À propos, contact) dépendent de la décision de L0 et feront l'objet d'un plan séparé une fois L0 mergée.

**Branches.** Deux branches indépendantes, toutes deux créées depuis `docs/v2-carnet-spec` (qui porte la spec et ce plan) : `feat/v2-l0-embeddings` (Tasks 1 à 7) et `feat/v2-l1-identity` (Tasks 8 à 12). Une PR par branche.

## Global Constraints

- Aucune modification du schéma Prisma ni des données du catalogue.
- Le build Vercel n'accède jamais à la base : il lit `content/map.json`.
- Professeur : `lightonai/mDenseOn` (prompts `query: ` et `document: ` déclarés dans `config_sentence_transformers.json`).
- Seuils de décision L0 : modèle + vocabulaire compressés ≤ 20 Mo ; première réponse sémantique ≤ 3 s en 4G ; embedding d'une requête ≤ 50 ms ; taux de succès à 3 face à mDenseOn ≥ 0,8 sur 20 requêtes (10 FR, 10 EN).
- Graine fixée (42) pour UMAP et k-means ; k = 5 par défaut.
- Polices : Bricolage Grotesque (600, 700) pour les titres, Source Serif 4 (400, 600, italique 400) pour la lecture, Caveat (500) pour les annotations, Fira Code (400, 500) pour les données ; Space Grotesk est retirée.
- Accent : indigo `oklch(0.45 0.15 270)` en clair, violet `oklch(0.65 0.22 270)` en sombre (inchangés).
- Animation : tracé d'encre ~600 ms, annotations décalées de ~250 ms, une seule fois par élément ; `prefers-reduced-motion` → état final immédiat.
- Textes d'interface en français, avec accents.
- Gestionnaire de paquets : pnpm. CI : `biome check --write` ne doit laisser aucun diff.

## Review Focus

- **Requête sans aucun mot connu** (« 🤖 zzqx », chiffres seuls) : `embedText` doit renvoyer `null`, jamais un vecteur NaN ni une exception. Test dans Task 3.
- **Majuscules, accents et apostrophes** (« Évaluation d'IA », « COMPUTER Vision ») : tokenisation identique en Python et en TypeScript. Couvert par les textes de parité de Task 2 et le test de Task 3.
- **Projet privé dans la base** : jamais présent dans le corpus, donc jamais sur la carte publique. Test dans Task 1.
- **Corpus minuscule** (moins de 4 éléments, ex. base vide) : `buildMap` ne lève pas d'exception et place les points dans [0, 1]. Test dans Task 5.
- **Article publié sans régénération de la carte** : un test échoue en CI avec le slug manquant. Test dans Task 6.

---

## Partie L0 — mesure et distillation (branche `feat/v2-l0-embeddings`)

### Task 1: Corpus du carnet et export

**Files:**
- Create: `lib/carnet/tokenize.ts`
- Create: `lib/carnet/corpus.ts`
- Create: `lib/carnet/corpus.test.ts`
- Create: `scripts/carnet/load-corpus.ts`
- Create: `scripts/carnet/export-corpus.ts`
- Modify: `package.json` (scripts)
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `getArticleSlugs()`, `getArticleBySlug(slug)` de `lib/articles/loader.ts` ; `prisma` de `lib/db.ts`.
- Produces:
  - `tokenize(text: string): string[]` (`lib/carnet/tokenize.ts`)
  - `normalizeKeyword(value: string): string`
  - `interface CorpusItem { id: string; kind: "article" | "project"; title: string; text: string; href: string; keywords: string[] }`
  - `interface ProjectForCorpus { id: number; title: string; description: string; github: string | null; isPrivate: boolean; languages: { language: string }[]; databases: { database: string }[]; backends: { backend: string }[]; frontends: { frontend: string }[]; devops: { devops: string }[] }`
  - `articleToCorpusItem(a: { slug: string; title: string; description: string; tags: string[] }): CorpusItem`
  - `projectToCorpusItem(p: ProjectForCorpus): CorpusItem | null` (null si privé)
  - `loadCorpus(): Promise<CorpusItem[]>` (`scripts/carnet/load-corpus.ts`)
  - fichier `scripts/distill/corpus.json` : `CorpusItem[]`

- [ ] **Step 1: Créer la branche**

```bash
cd /home/will/dev-project/portfolio
git fetch origin
git switch -c feat/v2-l0-embeddings origin/docs/v2-carnet-spec
```

- [ ] **Step 2: Écrire le test qui échoue**

`lib/carnet/corpus.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import {
	articleToCorpusItem,
	normalizeKeyword,
	type ProjectForCorpus,
	projectToCorpusItem,
} from "./corpus";
import { tokenize } from "./tokenize";

const baseProject: ProjectForCorpus = {
	id: 7,
	title: "P13-Fashion-Insta",
	description: "OpenClassroom ML/AI project on Vision task",
	github: "https://github.com/WillIsback/P13-Fashion-Insta",
	isPrivate: false,
	languages: [{ language: "Python" }],
	databases: [],
	backends: [{ backend: "FastAPI" }],
	frontends: [],
	devops: [{ devops: "Docker" }],
};

describe("tokenize", () => {
	it("plie accents et casse, coupe sur la ponctuation, ignore les mots d'une lettre", () => {
		expect(tokenize("Évaluation d'IA : COMPUTER Vision, à 2 mains")).toEqual([
			"evaluation",
			"ia",
			"computer",
			"vision",
			"mains",
		]);
	});

	it("renvoie une liste vide pour un texte sans mot", () => {
		expect(tokenize("🤖 ! ?")).toEqual([]);
	});
});

describe("normalizeKeyword", () => {
	it("met en minuscules et retire les accents", () => {
		expect(normalizeKeyword("Échec Système")).toBe("echec systeme");
	});
});

describe("articleToCorpusItem", () => {
	it("construit un élément article avec un id préfixé et des mots-clés normalisés", () => {
		const item = articleToCorpusItem({
			slug: "neuf-agents-neuf-jours",
			title: "Neuf agents, neuf jours",
			description: "Retour d'expérience sur une flotte d'agents.",
			tags: ["Agents autonomes", "SRE"],
		});
		expect(item).toEqual({
			id: "article:neuf-agents-neuf-jours",
			kind: "article",
			title: "Neuf agents, neuf jours",
			text: "Neuf agents, neuf jours. Retour d'expérience sur une flotte d'agents. Agents autonomes, SRE",
			href: "/articles/neuf-agents-neuf-jours",
			keywords: ["agents autonomes", "sre"],
		});
	});
});

describe("projectToCorpusItem", () => {
	it("construit un élément projet à partir des technologies", () => {
		const item = projectToCorpusItem(baseProject);
		expect(item).toEqual({
			id: "project:7",
			kind: "project",
			title: "P13-Fashion-Insta",
			text: "P13-Fashion-Insta. OpenClassroom ML/AI project on Vision task. Python, FastAPI, Docker",
			href: "https://github.com/WillIsback/P13-Fashion-Insta",
			keywords: ["python", "fastapi", "docker"],
		});
	});

	it("exclut un projet privé", () => {
		expect(projectToCorpusItem({ ...baseProject, isPrivate: true })).toBeNull();
	});

	it("exclut un projet sans lien GitHub", () => {
		expect(projectToCorpusItem({ ...baseProject, github: null })).toBeNull();
	});

	it("tolère une description vide", () => {
		expect(projectToCorpusItem({ ...baseProject, description: "" })?.text).toBe(
			"P13-Fashion-Insta. Python, FastAPI, Docker",
		);
	});
});
```

- [ ] **Step 3: Lancer le test pour le voir échouer**

Run: `pnpm vitest run lib/carnet/corpus.test.ts`
Expected: FAIL (`Cannot find module './corpus'` / `'./tokenize'`).

- [ ] **Step 4: Implémenter `tokenize.ts`**

```ts
/**
 * Tokenizer par mot du carnet. Doit rester strictement identique à
 * scripts/distill/carnet_text.py (test de parité : lib/carnet/static-model.test.ts).
 */
const COMBINING_MARKS = /\p{M}/gu;
const WORD = /[a-z0-9]+/g;

export function foldText(text: string): string {
	return text.normalize("NFKD").replace(COMBINING_MARKS, "").toLowerCase();
}

export function tokenize(text: string): string[] {
	return (foldText(text).match(WORD) ?? []).filter((word) => word.length >= 2);
}
```

- [ ] **Step 5: Implémenter `corpus.ts`**

```ts
import { foldText } from "./tokenize";

export interface CorpusItem {
	id: string;
	kind: "article" | "project";
	title: string;
	text: string;
	href: string;
	keywords: string[];
}

export interface ProjectForCorpus {
	id: number;
	title: string;
	description: string;
	github: string | null;
	isPrivate: boolean;
	languages: { language: string }[];
	databases: { database: string }[];
	backends: { backend: string }[];
	frontends: { frontend: string }[];
	devops: { devops: string }[];
}

export function normalizeKeyword(value: string): string {
	return foldText(value).trim().replace(/\s+/g, " ");
}

function joinSentences(parts: string[]): string {
	return parts
		.map((part) => part.trim().replace(/\.$/, ""))
		.filter((part) => part.length > 0)
		.join(". ");
}

export function articleToCorpusItem(article: {
	slug: string;
	title: string;
	description: string;
	tags: string[];
}): CorpusItem {
	return {
		id: `article:${article.slug}`,
		kind: "article",
		title: article.title,
		text: joinSentences([article.title, article.description, article.tags.join(", ")]),
		href: `/articles/${article.slug}`,
		keywords: article.tags.map(normalizeKeyword),
	};
}

export function projectToCorpusItem(project: ProjectForCorpus): CorpusItem | null {
	if (project.isPrivate || !project.github) return null;
	const tech = [
		...project.languages.map((l) => l.language),
		...project.databases.map((d) => d.database),
		...project.backends.map((b) => b.backend),
		...project.frontends.map((f) => f.frontend),
		...project.devops.map((d) => d.devops),
	];
	return {
		id: `project:${project.id}`,
		kind: "project",
		title: project.title,
		text: joinSentences([project.title, project.description, tech.join(", ")]),
		href: project.github,
		keywords: tech.map(normalizeKeyword),
	};
}
```

- [ ] **Step 6: Relancer le test**

Run: `pnpm vitest run lib/carnet/corpus.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 7: Chargeur du corpus (base + MDX)**

`scripts/carnet/load-corpus.ts` :

```ts
import { getArticleBySlug, getArticleSlugs } from "../../lib/articles/loader";
import {
	articleToCorpusItem,
	type CorpusItem,
	projectToCorpusItem,
} from "../../lib/carnet/corpus";
import { prisma } from "../../lib/db";

export async function loadCorpus(): Promise<CorpusItem[]> {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL manquante : lancer via `tsx --env-file=.env.local`.");
	}
	const articles = getArticleSlugs().map((slug) => articleToCorpusItem(getArticleBySlug(slug)));
	const projects = await prisma.project.findMany({
		select: {
			id: true,
			title: true,
			description: true,
			github: true,
			isPrivate: true,
			languages: { select: { language: true } },
			databases: { select: { database: true } },
			backends: { select: { backend: true } },
			frontends: { select: { frontend: true } },
			devops: { select: { devops: true } },
		},
		orderBy: { id: "asc" },
	});
	await prisma.$disconnect();
	const projectItems = projects
		.map(projectToCorpusItem)
		.filter((item): item is CorpusItem => item !== null);
	return [...articles, ...projectItems];
}
```

Vérifier avant d'écrire la suite que `getArticleBySlug(slug)` renvoie bien un objet avec `slug`, `title`, `description`, `tags` (lire `lib/articles/loader.ts:104`) ; s'il renvoie `Article | null`, filtrer les `null` avant `articleToCorpusItem`.

- [ ] **Step 8: Script d'export**

`scripts/carnet/export-corpus.ts` :

```ts
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadCorpus } from "./load-corpus";

const OUT = path.join(process.cwd(), "scripts", "distill", "corpus.json");

const corpus = await loadCorpus();
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(corpus, null, 2)}\n`);
const counts = corpus.reduce<Record<string, number>>((acc, item) => {
	acc[item.kind] = (acc[item.kind] ?? 0) + 1;
	return acc;
}, {});
console.log(`corpus.json : ${corpus.length} éléments`, counts);
```

Dans `package.json`, ajouter aux `scripts` :

```json
"carnet:corpus": "tsx --env-file=.env.local scripts/carnet/export-corpus.ts",
```

Dans `.gitignore`, ajouter :

```
# Carnet : artefacts de distillation non publiés
scripts/distill/corpus.json
scripts/distill/.venv/
scripts/distill/report.json
```

- [ ] **Step 9: Lancer l'export**

Run: `pnpm carnet:corpus`
Expected: `corpus.json : N éléments { article: 1, project: M }` avec M ≥ 20, aucun projet privé (vérifier : `grep -c '"kind": "project"' scripts/distill/corpus.json`).

- [ ] **Step 10: Commit**

```bash
pnpm exec biome check --write lib/carnet scripts/carnet
git add lib/carnet scripts/carnet package.json .gitignore
git commit -m "feat(carnet): corpus du carnet (articles + projets publics) et export

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Distillation de mDenseOn en embeddings statiques (Python)

**Files:**
- Create: `scripts/distill/pyproject.toml`
- Create: `scripts/distill/carnet_text.py`
- Create: `scripts/distill/carnet_static.py`
- Create: `scripts/distill/build_vocab.py`
- Create: `scripts/distill/distill.py`
- Create: `scripts/distill/golden_texts.json`
- Create: `scripts/distill/test_carnet.py`
- Output (versionné) : `public/models/carnet-static/{meta.json,vocab.json,vectors.i8,scales.f32}`, `lib/carnet/__fixtures__/golden.json`

**Interfaces:**
- Consumes: `scripts/distill/corpus.json` (Task 1).
- Produces (format des fichiers, lu par Task 3) :
  - `meta.json` : `{ "version": "<sha256 12 car.>", "teacher": "lightonai/mDenseOn", "dim": 128, "vocabSize": <int>, "wordPrompt": "none" | "query" | "document", "sifA": 0.0001 }`
  - `vocab.json` : `string[]` (index = ligne de la matrice)
  - `vectors.i8` : `vocabSize × dim` octets signés, ligne par ligne
  - `scales.f32` : `vocabSize` flottants 32 bits little-endian (échelle de dé-quantification par ligne)
  - `golden.json` : `[{ "text": string, "tokens": string[], "embedding": number[] | null }]`

La méthode est celle de model2vec (un embedding par mot calculé par le professeur, PCA, pondération SIF) implémentée directement : model2vec 0.9 ajoute le vocabulaire au tokenizer sous-mots de mmBERT (256 000 tokens), trop lourd pour le navigateur.

- [ ] **Step 1: Projet Python**

`scripts/distill/pyproject.toml` :

```toml
[project]
name = "carnet-distill"
version = "0.1.0"
requires-python = ">=3.11,<3.13"
dependencies = [
  "sentence-transformers==5.4.1",
  "transformers==5.6.2",
  "torch>=2.8",  # 2.8+ : roues CUDA 12.8 (Blackwell / RTX 50xx) et CPU
  "numpy>=2.0",
  "wordfreq==3.1.1",
]

[dependency-groups]
dev = ["pytest>=8"]

[tool.uv]
package = false
```

- [ ] **Step 2: Écrire les tests qui échouent**

`scripts/distill/test_carnet.py` :

```python
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
```

- [ ] **Step 3: Lancer les tests pour les voir échouer**

Run: `cd scripts/distill && uv sync && uv run pytest -q`
Expected: FAIL (`ModuleNotFoundError: carnet_static`).

- [ ] **Step 4: Implémenter `carnet_text.py`**

```python
"""Tokenizer par mot du carnet. Doit rester identique à lib/carnet/tokenize.ts."""

import re
import unicodedata

WORD = re.compile(r"[a-z0-9]+")


def fold_text(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text)
    return "".join(c for c in decomposed if not unicodedata.category(c).startswith("M")).lower()


def tokenize(text: str) -> list[str]:
    return [w for w in WORD.findall(fold_text(text)) if len(w) >= 2]
```

(`category(c).startswith("M")` correspond exactement à `\p{M}` côté TypeScript.)

- [ ] **Step 5: Implémenter `carnet_static.py`**

```python
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
```

- [ ] **Step 6: Implémenter `build_vocab.py`**

```python
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
```

- [ ] **Step 7: Lancer les tests**

Run: `cd scripts/distill && uv run pytest -q`
Expected: PASS (5 tests).

- [ ] **Step 8: Textes de parité**

`scripts/distill/golden_texts.json` :

```json
[
  "Vision par ordinateur",
  "COMPUTER Vision",
  "Évaluation d'IA générative",
  "Agents autonomes pour l'infrastructure",
  "fine-tuning ModernBERT pour la classification",
  "Transcription audio et diarisation (WhisperX)",
  "local LLM inference on a DGX Spark",
  "Œuvre à côté de l'été",
  "🤖 zzqx",
  "2026"
]
```

- [ ] **Step 9: Implémenter `distill.py`**

```python
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
```

- [ ] **Step 10: Construire le vocabulaire et distiller**

Le calcul (~40 000 mots isolés de quelques tokens dans un modèle de 307 M de paramètres) doit tenir en quelques minutes sur le CPU du home-server. Chronométrer d'abord :

```bash
cd /home/will/dev-project/portfolio/scripts/distill
uv run python build_vocab.py --corpus corpus.json --common 20000 --out vocab.txt
uv run python distill.py --vocab vocab.txt --limit 1000 --device cpu
```

- **Estimation ≤ 30 min** : lancer la distillation sur le home-server :
  `uv run python distill.py --vocab vocab.txt --dims 128 --word-prompt none --device cpu`
- **Estimation > 30 min** : STOP. Demander à William de lancer la distillation sur son PC (RTX 5080) et lui fournir ces instructions, puis attendre qu'il pousse le résultat :
  ```bash
  git fetch origin && git switch feat/v2-l0-embeddings
  # copier scripts/distill/vocab.txt depuis le home-server (fichier non versionné), puis :
  cd scripts/distill && uv sync
  uv run python distill.py --vocab vocab.txt --dims 128 --word-prompt none --device cuda
  cd ../.. && git add public/models/carnet-static lib/carnet/__fixtures__/golden.json
  git commit -m "feat(carnet): modèle distillé (RTX 5080)" && git push
  ```

Expected: `modèle <hash> : ~3xxxx mots × 128 dims -> …/public/models/carnet-static`, et les fichiers `meta.json`, `vocab.json`, `vectors.i8`, `scales.f32`, `lib/carnet/__fixtures__/golden.json` présents. Ajouter `vocab.txt` au `.gitignore` (régénérable).

- [ ] **Step 11: Commit**

```bash
cd /home/will/dev-project/portfolio
echo "scripts/distill/vocab.txt" >> .gitignore
git add scripts/distill/*.py scripts/distill/pyproject.toml scripts/distill/uv.lock scripts/distill/golden_texts.json \
  public/models/carnet-static lib/carnet/__fixtures__/golden.json .gitignore
git commit -m "feat(carnet): distillation de mDenseOn en embeddings statiques par mot

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: Runtime TypeScript du modèle statique et test de parité

**Files:**
- Create: `lib/carnet/static-model.ts`
- Create: `lib/carnet/static-model-node.ts`
- Create: `lib/carnet/static-model.test.ts`

**Interfaces:**
- Consumes: `tokenize` (Task 1) ; fichiers de `public/models/carnet-static/` et `lib/carnet/__fixtures__/golden.json` (Task 2).
- Produces:
  - `interface StaticModelMeta { version: string; teacher: string; dim: number; vocabSize: number; wordPrompt: string; sifA: number }`
  - `interface StaticModel { meta: StaticModelMeta; vocab: Map<string, number>; vectors: Int8Array; scales: Float32Array }`
  - `createStaticModel(meta: StaticModelMeta, words: string[], vectors: Int8Array, scales: Float32Array): StaticModel`
  - `embedTokens(model: StaticModel, tokens: string[]): Float32Array | null`
  - `embedText(model: StaticModel, text: string): Float32Array | null`
  - `cosine(a: ArrayLike<number>, b: ArrayLike<number>): number`
  - `loadStaticModelFromDir(dir: string): StaticModel` (`static-model-node.ts`, Node uniquement)
  - constante `CARNET_MODEL_DIR = path.join(process.cwd(), "public", "models", "carnet-static")`

- [ ] **Step 1: Écrire le test qui échoue**

`lib/carnet/static-model.test.ts` :

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { cosine, createStaticModel, embedText, embedTokens } from "./static-model";
import { CARNET_MODEL_DIR, loadStaticModelFromDir } from "./static-model-node";
import { tokenize } from "./tokenize";

const tiny = createStaticModel(
	{ version: "t", teacher: "t", dim: 2, vocabSize: 2, wordPrompt: "none", sifA: 1e-4 },
	["vision", "agents"],
	new Int8Array([127, 0, 0, 127]),
	new Float32Array([1 / 127, 1 / 127]),
);

describe("embedTokens", () => {
	it("moyenne les mots connus et normalise", () => {
		const v = embedTokens(tiny, ["vision", "agents", "inconnu"]);
		expect(v).not.toBeNull();
		expect(v?.[0]).toBeCloseTo(Math.SQRT1_2, 5);
		expect(v?.[1]).toBeCloseTo(Math.SQRT1_2, 5);
	});

	it("renvoie null quand aucun mot n'est connu", () => {
		expect(embedTokens(tiny, ["inconnu"])).toBeNull();
		expect(embedText(tiny, "🤖 zzqx")).toBeNull();
		expect(embedText(tiny, "")).toBeNull();
	});
});

describe("createStaticModel", () => {
	it("refuse des tailles incohérentes", () => {
		expect(() =>
			createStaticModel(
				{ version: "t", teacher: "t", dim: 2, vocabSize: 2, wordPrompt: "none", sifA: 1e-4 },
				["a"],
				new Int8Array(4),
				new Float32Array(2),
			),
		).toThrow(/vocab/);
	});
});

describe("cosine", () => {
	it("vaut 1 pour deux vecteurs identiques et 0 pour des orthogonaux", () => {
		expect(cosine([1, 0], [1, 0])).toBeCloseTo(1);
		expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
	});
});

describe("parité avec le calcul Python", () => {
	const golden: { text: string; tokens: string[]; embedding: number[] | null }[] = JSON.parse(
		readFileSync(path.join(__dirname, "__fixtures__", "golden.json"), "utf8"),
	);
	const model = loadStaticModelFromDir(CARNET_MODEL_DIR);

	it.each(golden)("même tokenisation et même embedding pour « $text »", ({ text, tokens, embedding }) => {
		expect(tokenize(text)).toEqual(tokens);
		const v = embedText(model, text);
		if (embedding === null) {
			expect(v).toBeNull();
		} else {
			expect(v).not.toBeNull();
			expect(cosine(v as Float32Array, embedding)).toBeGreaterThan(0.9999);
		}
	});
});
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

Run: `pnpm vitest run lib/carnet/static-model.test.ts`
Expected: FAIL (`Cannot find module './static-model'`).

- [ ] **Step 3: Implémenter `static-model.ts`**

```ts
import { tokenize } from "./tokenize";

export interface StaticModelMeta {
	version: string;
	teacher: string;
	dim: number;
	vocabSize: number;
	wordPrompt: string;
	sifA: number;
}

export interface StaticModel {
	meta: StaticModelMeta;
	vocab: Map<string, number>;
	vectors: Int8Array;
	scales: Float32Array;
}

export function createStaticModel(
	meta: StaticModelMeta,
	words: string[],
	vectors: Int8Array,
	scales: Float32Array,
): StaticModel {
	if (words.length !== meta.vocabSize) {
		throw new Error(`vocab : ${words.length} mots pour vocabSize=${meta.vocabSize}`);
	}
	if (vectors.length !== meta.vocabSize * meta.dim || scales.length !== meta.vocabSize) {
		throw new Error("vectors/scales : tailles incohérentes avec meta");
	}
	return { meta, vocab: new Map(words.map((word, index) => [word, index])), vectors, scales };
}

export function embedTokens(model: StaticModel, tokens: string[]): Float32Array | null {
	const { dim } = model.meta;
	const sum = new Float64Array(dim);
	let count = 0;
	for (const token of tokens) {
		const row = model.vocab.get(token);
		if (row === undefined) continue;
		const scale = model.scales[row];
		const offset = row * dim;
		for (let j = 0; j < dim; j++) sum[j] += model.vectors[offset + j] * scale;
		count++;
	}
	if (count === 0) return null;
	let norm = 0;
	for (let j = 0; j < dim; j++) {
		sum[j] /= count;
		norm += sum[j] * sum[j];
	}
	norm = Math.sqrt(norm);
	if (norm === 0) return null;
	const out = new Float32Array(dim);
	for (let j = 0; j < dim; j++) out[j] = sum[j] / norm;
	return out;
}

export function embedText(model: StaticModel, text: string): Float32Array | null {
	return embedTokens(model, tokenize(text));
}

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
	let dot = 0;
	let na = 0;
	let nb = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		na += a[i] * a[i];
		nb += b[i] * b[i];
	}
	return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}
```

- [ ] **Step 4: Implémenter `static-model-node.ts`**

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { createStaticModel, type StaticModel, type StaticModelMeta } from "./static-model";

export const CARNET_MODEL_DIR = path.join(process.cwd(), "public", "models", "carnet-static");

export function loadStaticModelFromDir(dir: string): StaticModel {
	const meta: StaticModelMeta = JSON.parse(readFileSync(path.join(dir, "meta.json"), "utf8"));
	const words: string[] = JSON.parse(readFileSync(path.join(dir, "vocab.json"), "utf8"));
	const v = readFileSync(path.join(dir, "vectors.i8"));
	const s = readFileSync(path.join(dir, "scales.f32"));
	const vectors = new Int8Array(v.buffer, v.byteOffset, v.byteLength);
	const scales = new Float32Array(s.buffer.slice(s.byteOffset, s.byteOffset + s.byteLength));
	return createStaticModel(meta, words, vectors, scales);
}
```

(`scales` est copié via `slice` car un `Float32Array` exige un offset aligné sur 4 octets.)

- [ ] **Step 5: Relancer le test**

Run: `pnpm vitest run lib/carnet/static-model.test.ts`
Expected: PASS (4 tests unitaires + 10 cas de parité). Si un cas de parité échoue sur la tokenisation, corriger `tokenize.ts` et `carnet_text.py` pour qu'ils concordent, puis relancer `distill.py` (Task 2, step 10) pour régénérer `golden.json`.

- [ ] **Step 6: Commit**

```bash
pnpm exec biome check --write lib/carnet
git add lib/carnet
git commit -m "feat(carnet): runtime du modèle statique, parité vérifiée avec Python

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 4: Mesures de L0 (accord avec mDenseOn, taille, latence)

**Files:**
- Create: `scripts/distill/queries.json`
- Create: `scripts/distill/evaluate.py`
- Create: `scripts/carnet/bench.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: `corpus.json` (Task 1), modèle publié (Task 2), `loadStaticModelFromDir`, `embedText` (Task 3), `carnet_static.load_student`, `embed_tokens` (Task 2).
- Produces: `scripts/distill/report.json` (`{ hitAt3: number, overlapAt3: number, queries: number, gzipBytes: number, est4gSeconds: number, perQuery: [...] }`) et la sortie console de `pnpm carnet:bench` (`load ms`, `p50 ms`, `p95 ms`).

- [ ] **Step 1: Requêtes de mesure**

`scripts/distill/queries.json` :

```json
[
  {"q": "vision par ordinateur", "lang": "fr"},
  {"q": "classification de texte avec un transformer", "lang": "fr"},
  {"q": "agents autonomes pour l'infrastructure", "lang": "fr"},
  {"q": "transcription audio et diarisation", "lang": "fr"},
  {"q": "génération de docstrings avec un LLM local", "lang": "fr"},
  {"q": "correcteur grammatical", "lang": "fr"},
  {"q": "recherche documentaire et RAG", "lang": "fr"},
  {"q": "prévision avec du machine learning tabulaire", "lang": "fr"},
  {"q": "tableau de bord et visualisation de données", "lang": "fr"},
  {"q": "sécurité et détection de secrets", "lang": "fr"},
  {"q": "computer vision", "lang": "en"},
  {"q": "fine-tuning a text classifier", "lang": "en"},
  {"q": "autonomous SRE agents", "lang": "en"},
  {"q": "speech to text", "lang": "en"},
  {"q": "local LLM inference", "lang": "en"},
  {"q": "meeting report generation", "lang": "en"},
  {"q": "secret detection", "lang": "en"},
  {"q": "Rust command line tool", "lang": "en"},
  {"q": "project management SaaS", "lang": "en"},
  {"q": "observability and tracing", "lang": "en"}
]
```

- [ ] **Step 2: Implémenter `evaluate.py`**

```python
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
```

- [ ] **Step 3: Implémenter `bench.ts`**

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { embedText } from "../../lib/carnet/static-model";
import { CARNET_MODEL_DIR, loadStaticModelFromDir } from "../../lib/carnet/static-model-node";

const queries: { q: string }[] = JSON.parse(
	readFileSync(path.join(process.cwd(), "scripts", "distill", "queries.json"), "utf8"),
);

const t0 = performance.now();
const model = loadStaticModelFromDir(CARNET_MODEL_DIR);
const loadMs = performance.now() - t0;

const timings: number[] = [];
for (let round = 0; round < 10; round++) {
	for (const { q } of queries) {
		const start = performance.now();
		embedText(model, q);
		timings.push(performance.now() - start);
	}
}
timings.sort((a, b) => a - b);
const pct = (p: number) => timings[Math.min(timings.length - 1, Math.floor(p * timings.length))];
console.log(
	`chargement ${loadMs.toFixed(0)} ms · embedding p50 ${pct(0.5).toFixed(3)} ms · p95 ${pct(0.95).toFixed(3)} ms (${timings.length} appels)`,
);
```

Dans `package.json`, ajouter : `"carnet:bench": "tsx scripts/carnet/bench.ts",`

- [ ] **Step 4: Lancer les mesures**

```bash
cd scripts/distill && uv run python evaluate.py && cd ../..
pnpm carnet:bench
```

Expected: une ligne `hit@3=… overlap@3=… gzip=… Mo 4G≈… s` et une ligne `chargement … ms · embedding p50 … ms · p95 … ms`.

- [ ] **Step 5: Explorer si un seuil est manqué**

Si `hit@3 < 0.8`, relancer distillation puis évaluation avec `--word-prompt query`, puis `--word-prompt document`, puis `--dims 256`, et garder la meilleure configuration qui respecte la taille (≤ 20 Mo compressés). Si `gzip > 20 Mo`, relancer `build_vocab.py --common 10000`. Noter chaque essai (configuration → hit@3, gzip) pour la PR. La configuration retenue est celle publiée dans `public/models/carnet-static/`.

- [ ] **Step 6: Commit**

```bash
pnpm exec biome check --write scripts/carnet
git add scripts/distill/queries.json scripts/distill/evaluate.py scripts/carnet/bench.ts package.json public/models/carnet-static lib/carnet/__fixtures__/golden.json
git commit -m "feat(carnet): mesures L0 (accord avec mDenseOn, taille, latence)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 5: Construction de la carte (UMAP, k-means, schéma)

**Files:**
- Create: `lib/carnet/map-types.ts`
- Create: `lib/carnet/map-build.ts`
- Create: `lib/carnet/map-build.test.ts`
- Modify: `package.json` (dépendance `umap-js` en devDependency)

**Interfaces:**
- Consumes: `CorpusItem` (Task 1).
- Produces:
  - `MapDataSchema` (zod) et `type MapData = { model: string; generatedAt: string; clusters: { id: string; label: string }[]; items: MapItem[] }`, `type MapItem = { id: string; kind: "article" | "project"; title: string; href: string; x: number; y: number; cluster: string; keywords: string[]; vector: number[] }`
  - `mulberry32(seed: number): () => number`
  - `kmeans(vectors: ArrayLike<number>[], k: number, random: () => number, iterations?: number): number[]`
  - `normalizeCoords(points: number[][], margin?: number): [number, number][]`
  - `suggestClusterLabels(items: { cluster: string; keywords: string[] }[]): Record<string, string>`
  - `buildMap(corpus: CorpusItem[], vectors: Float32Array[], options: { k: number; seed: number; model: string; now: Date; labels: Record<string, string> }): MapData`

- [ ] **Step 1: Installer UMAP**

Run: `pnpm add -D umap-js@1.4.0`

- [ ] **Step 2: Écrire le test qui échoue**

`lib/carnet/map-build.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import type { CorpusItem } from "./corpus";
import { buildMap, kmeans, mulberry32, normalizeCoords, suggestClusterLabels } from "./map-build";
import { MapDataSchema } from "./map-types";

function item(i: number, keywords: string[]): CorpusItem {
	return { id: `project:${i}`, kind: "project", title: `P${i}`, text: `P${i}`, href: `https://x/${i}`, keywords };
}

function vec(...v: number[]): Float32Array {
	const n = Math.hypot(...v);
	return Float32Array.from(v.map((x) => x / n));
}

const groupA = Array.from({ length: 6 }, (_, i) => vec(1, 0.05 * i, 0));
const groupB = Array.from({ length: 6 }, (_, i) => vec(0, 1, 0.05 * i));
const corpus = [
	...groupA.map((_, i) => item(i, ["python", "vision"])),
	...groupB.map((_, i) => item(i + 6, ["rust"])),
];
const options = { k: 2, seed: 42, model: "carnet-static@test", now: new Date("2026-10-07T00:00:00Z"), labels: {} };

describe("kmeans", () => {
	it("sépare deux groupes nets et reste déterministe à graine égale", () => {
		const a = kmeans([...groupA, ...groupB], 2, mulberry32(42));
		const b = kmeans([...groupA, ...groupB], 2, mulberry32(42));
		expect(a).toEqual(b);
		expect(new Set(a.slice(0, 6)).size).toBe(1);
		expect(new Set(a.slice(6)).size).toBe(1);
		expect(a[0]).not.toBe(a[6]);
	});
});

describe("normalizeCoords", () => {
	it("ramène les points dans [marge, 1 - marge]", () => {
		const out = normalizeCoords([[-10, 5], [10, 25], [0, 15]], 0.1);
		for (const [x, y] of out) {
			expect(x).toBeGreaterThanOrEqual(0.1);
			expect(x).toBeLessThanOrEqual(0.9);
			expect(y).toBeGreaterThanOrEqual(0.1);
			expect(y).toBeLessThanOrEqual(0.9);
		}
	});

	it("centre un nuage dégénéré (un seul point)", () => {
		expect(normalizeCoords([[3, 3]])).toEqual([[0.5, 0.5]]);
	});
});

describe("suggestClusterLabels", () => {
	it("prend le mot-clé le plus fréquent, à égalité le premier par ordre alphabétique", () => {
		expect(
			suggestClusterLabels([
				{ cluster: "c1", keywords: ["vision", "python"] },
				{ cluster: "c1", keywords: ["python"] },
				{ cluster: "c2", keywords: ["rust", "cli"] },
			]),
		).toEqual({ c1: "python", c2: "cli" });
	});
});

describe("buildMap", () => {
	it("produit une carte valide, déterministe, avec des coordonnées dans [0, 1]", () => {
		const a = buildMap(corpus, [...groupA, ...groupB], options);
		const b = buildMap(corpus, [...groupA, ...groupB], options);
		expect(MapDataSchema.parse(a)).toEqual(a);
		expect(a).toEqual(b);
		expect(a.items).toHaveLength(12);
		expect(a.clusters.map((c) => c.id)).toEqual(["c1", "c2"]);
	});

	it("applique les noms de groupes fournis", () => {
		const map = buildMap(corpus, [...groupA, ...groupB], { ...options, labels: { c1: "Vision" } });
		expect(map.clusters.find((c) => c.id === "c1")?.label).toBe("Vision");
	});

	it("ne plante pas sur un corpus minuscule", () => {
		const map = buildMap(corpus.slice(0, 2), [groupA[0], groupB[0]], options);
		expect(map.items).toHaveLength(2);
		for (const it of map.items) {
			expect(it.x).toBeGreaterThanOrEqual(0);
			expect(it.x).toBeLessThanOrEqual(1);
		}
	});

	it("refuse des longueurs incohérentes", () => {
		expect(() => buildMap(corpus, [groupA[0]], options)).toThrow(/vectors/);
	});
});
```

- [ ] **Step 3: Lancer le test pour le voir échouer**

Run: `pnpm vitest run lib/carnet/map-build.test.ts`
Expected: FAIL (`Cannot find module './map-build'`).

- [ ] **Step 4: Implémenter `map-types.ts`**

```ts
import { z } from "zod";

export const MapItemSchema = z.object({
	id: z.string(),
	kind: z.enum(["article", "project"]),
	title: z.string(),
	href: z.string(),
	x: z.number().min(0).max(1),
	y: z.number().min(0).max(1),
	cluster: z.string(),
	keywords: z.array(z.string()),
	vector: z.array(z.number()),
});

export const MapDataSchema = z.object({
	model: z.string(),
	generatedAt: z.string(),
	clusters: z.array(z.object({ id: z.string(), label: z.string() })),
	items: z.array(MapItemSchema),
});

export type MapItem = z.infer<typeof MapItemSchema>;
export type MapData = z.infer<typeof MapDataSchema>;
```

- [ ] **Step 5: Implémenter `map-build.ts`**

```ts
import { UMAP } from "umap-js";
import type { CorpusItem } from "./corpus";
import type { MapData } from "./map-types";

export function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function dist(a: ArrayLike<number>, b: ArrayLike<number>): number {
	let dot = 0;
	for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
	return 1 - dot;
}

export function kmeans(
	vectors: ArrayLike<number>[],
	k: number,
	random: () => number,
	iterations = 50,
): number[] {
	const n = vectors.length;
	const kk = Math.max(1, Math.min(k, n));
	const dim = vectors[0]?.length ?? 0;
	const centers: number[][] = [Array.from(vectors[Math.floor(random() * n)])];
	while (centers.length < kk) {
		const d2 = vectors.map((v) => Math.min(...centers.map((c) => dist(v, c))) ** 2);
		const total = d2.reduce((s, x) => s + x, 0);
		let r = random() * total;
		let pick = 0;
		while (pick < n - 1 && r > d2[pick]) r -= d2[pick++];
		centers.push(Array.from(vectors[pick]));
	}
	let assign = new Array<number>(n).fill(0);
	for (let iter = 0; iter < iterations; iter++) {
		const next = vectors.map((v) => {
			let best = 0;
			for (let c = 1; c < kk; c++) if (dist(v, centers[c]) < dist(v, centers[best])) best = c;
			return best;
		});
		const stable = next.every((c, i) => c === assign[i]) && iter > 0;
		assign = next;
		for (let c = 0; c < kk; c++) {
			const members = vectors.filter((_, i) => assign[i] === c);
			if (members.length === 0) continue;
			const mean = new Array<number>(dim).fill(0);
			for (const m of members) for (let j = 0; j < dim; j++) mean[j] += m[j] / members.length;
			const norm = Math.hypot(...mean) || 1;
			centers[c] = mean.map((x) => x / norm);
		}
		if (stable) break;
	}
	return assign;
}

export function normalizeCoords(points: number[][], margin = 0.06): [number, number][] {
	const xs = points.map((p) => p[0]);
	const ys = points.map((p) => p[1]);
	const scale = (v: number, min: number, max: number) =>
		max === min ? 0.5 : margin + ((v - min) / (max - min)) * (1 - 2 * margin);
	const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
	return points.map((p) => [scale(p[0], minX, maxX), scale(p[1], minY, maxY)]);
}

export function suggestClusterLabels(
	items: { cluster: string; keywords: string[] }[],
): Record<string, string> {
	const counts = new Map<string, Map<string, number>>();
	for (const it of items) {
		const c = counts.get(it.cluster) ?? new Map<string, number>();
		for (const kw of it.keywords) c.set(kw, (c.get(kw) ?? 0) + 1);
		counts.set(it.cluster, c);
	}
	const labels: Record<string, string> = {};
	for (const [cluster, c] of counts) {
		const sorted = [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
		labels[cluster] = sorted[0]?.[0] ?? cluster;
	}
	return labels;
}

function layout2d(vectors: Float32Array[], random: () => number): number[][] {
	const n = vectors.length;
	if (n < 4) {
		return vectors.map((_, i) => [Math.cos((2 * Math.PI * i) / n), Math.sin((2 * Math.PI * i) / n)]);
	}
	const umap = new UMAP({ nComponents: 2, nNeighbors: Math.min(15, n - 1), minDist: 0.1, random });
	return umap.fit(vectors.map((v) => Array.from(v)));
}

export function buildMap(
	corpus: CorpusItem[],
	vectors: Float32Array[],
	options: { k: number; seed: number; model: string; now: Date; labels: Record<string, string> },
): MapData {
	if (corpus.length !== vectors.length) {
		throw new Error(`vectors : ${vectors.length} pour ${corpus.length} éléments`);
	}
	const coords = normalizeCoords(layout2d(vectors, mulberry32(options.seed)));
	const raw = kmeans(vectors, options.k, mulberry32(options.seed + 1));
	const order = [...new Set(raw)];
	const clusterOf = (i: number) => `c${order.indexOf(raw[i]) + 1}`;
	const items = corpus.map((it, i) => ({
		id: it.id,
		kind: it.kind,
		title: it.title,
		href: it.href,
		x: Number(coords[i][0].toFixed(4)),
		y: Number(coords[i][1].toFixed(4)),
		cluster: clusterOf(i),
		keywords: it.keywords,
		vector: Array.from(vectors[i], (x) => Number(x.toFixed(4))),
	}));
	const suggested = suggestClusterLabels(items);
	const clusters = order.map((_, idx) => {
		const id = `c${idx + 1}`;
		return { id, label: options.labels[id] ?? suggested[id] ?? id };
	});
	return { model: options.model, generatedAt: options.now.toISOString(), clusters, items };
}
```

- [ ] **Step 6: Relancer le test**

Run: `pnpm vitest run lib/carnet/map-build.test.ts`
Expected: PASS (8 tests). Si l'import `umap-js` échoue sous Vitest, vérifier l'export nommé (`import { UMAP } from "umap-js"`) dans `node_modules/umap-js/package.json`.

- [ ] **Step 7: Commit**

```bash
pnpm exec biome check --write lib/carnet
git add lib/carnet package.json pnpm-lock.yaml
git commit -m "feat(carnet): construction de la carte (UMAP, k-means, schéma)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 6: Commande `pnpm embeddings` et `content/map.json`

**Files:**
- Create: `content/map-clusters.ts`
- Create: `scripts/carnet/build-map.ts`
- Create: `lib/carnet/map-content.test.ts`
- Output (versionné) : `content/map.json`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: `loadCorpus` (Task 1), `loadStaticModelFromDir`, `embedText` (Task 3), `buildMap`, `MapDataSchema` (Task 5), `getArticleSlugs` (loader existant).
- Produces: `content/map.json` (conforme à `MapDataSchema`) ; `clusterLabels: Record<string, string>`.

- [ ] **Step 1: Noms de groupes**

`content/map-clusters.ts` :

```ts
/**
 * Noms des groupes de la carte (Fig. 1). Clé = identifiant produit par `pnpm embeddings`
 * (c1…c5). Une clé absente garde le nom proposé automatiquement (mot-clé dominant).
 */
export const clusterLabels: Record<string, string> = {};
```

- [ ] **Step 2: Script de construction**

`scripts/carnet/build-map.ts` :

```ts
import { writeFileSync } from "node:fs";
import path from "node:path";
import { clusterLabels } from "../../content/map-clusters";
import { buildMap } from "../../lib/carnet/map-build";
import { MapDataSchema } from "../../lib/carnet/map-types";
import { embedText } from "../../lib/carnet/static-model";
import { CARNET_MODEL_DIR, loadStaticModelFromDir } from "../../lib/carnet/static-model-node";
import { loadCorpus } from "./load-corpus";

const OUT = path.join(process.cwd(), "content", "map.json");

const model = loadStaticModelFromDir(CARNET_MODEL_DIR);
const corpus = await loadCorpus();
const kept = corpus
	.map((item) => ({ item, vector: embedText(model, item.text) }))
	.filter((x): x is { item: typeof x.item; vector: Float32Array } => {
		if (x.vector === null) console.warn(`ignoré (aucun mot connu) : ${x.item.id}`);
		return x.vector !== null;
	});
const map = MapDataSchema.parse(
	buildMap(
		kept.map((x) => x.item),
		kept.map((x) => x.vector),
		{ k: 5, seed: 42, model: `carnet-static@${model.meta.version}`, now: new Date(), labels: clusterLabels },
	),
);
writeFileSync(OUT, `${JSON.stringify(map, null, 1)}\n`);
console.log(`content/map.json : ${map.items.length} éléments, groupes :`, map.clusters);
```

Dans `package.json`, ajouter : `"embeddings": "tsx --env-file=.env.local scripts/carnet/build-map.ts",`

- [ ] **Step 3: Générer la carte**

Run: `pnpm embeddings`
Expected: `content/map.json : N éléments, groupes : [ { id: 'c1', label: … }, … ]`, aucun élément ignoré (sinon, ajouter les mots manquants au corpus de vocabulaire et refaire Task 2 step 10).

- [ ] **Step 4: Écrire le test du contenu**

`lib/carnet/map-content.test.ts` :

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getArticleSlugs } from "@/lib/articles/loader";
import { MapDataSchema } from "./map-types";

const map = MapDataSchema.parse(
	JSON.parse(readFileSync(path.join(process.cwd(), "content", "map.json"), "utf8")),
);

describe("content/map.json", () => {
	it("contient chaque article publié (sinon : relancer `pnpm embeddings`)", () => {
		const onMap = new Set(map.items.filter((i) => i.kind === "article").map((i) => i.id));
		const missing = getArticleSlugs().filter((slug) => !onMap.has(`article:${slug}`));
		expect(missing).toEqual([]);
	});

	it("n'a que des identifiants uniques et des groupes déclarés", () => {
		const ids = map.items.map((i) => i.id);
		expect(new Set(ids).size).toBe(ids.length);
		const clusters = new Set(map.clusters.map((c) => c.id));
		for (const i of map.items) expect(clusters.has(i.cluster)).toBe(true);
	});

	it("stocke des vecteurs de la dimension du modèle", () => {
		const dims = new Set(map.items.map((i) => i.vector.length));
		expect(dims.size).toBe(1);
	});
});
```

- [ ] **Step 5: Lancer le test**

Run: `pnpm vitest run lib/carnet/map-content.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
pnpm exec biome check --write content scripts/carnet lib/carnet
git add content/map.json content/map-clusters.ts scripts/carnet/build-map.ts lib/carnet/map-content.test.ts package.json
git commit -m "feat(carnet): commande pnpm embeddings et carte content/map.json

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 7: CI, documentation, décision et PR L0

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `scripts/distill/README.md`

**Interfaces:**
- Consumes: `report.json` et sortie de `pnpm carnet:bench` (Task 4).
- Produces: PR `feat/v2-l0-embeddings` avec la décision.

- [ ] **Step 1: Tests en CI**

Dans `.github/workflows/ci.yml`, après l'étape `Check for uncommitted changes`, ajouter :

```yaml
      - name: Run tests
        run: pnpm test
```

- [ ] **Step 2: README de la distillation**

`scripts/distill/README.md` (remplacer les valeurs entre crochets par les mesures réelles de Task 4) :

```markdown
# Modèle statique du carnet

Distillation de `lightonai/mDenseOn` en embeddings statiques par mot (méthode model2vec :
un embedding par mot calculé par le professeur, PCA, pondération SIF, quantification int8 par ligne),
pour la recherche sémantique de la Fig. 1, exécutée dans le navigateur du visiteur.

## Régénérer

    pnpm carnet:corpus                      # export du corpus (base + articles) -> scripts/distill/corpus.json
    cd scripts/distill
    uv run python build_vocab.py --common 20000
    uv run python distill.py --dims 128 --word-prompt none   # --device cuda sur le DGX
    uv run python evaluate.py               # accord avec mDenseOn, taille, 4G estimé
    cd ../.. && pnpm carnet:bench           # latence
    pnpm embeddings                          # content/map.json

## Mesures retenues

| Critère | Seuil | Mesure |
| --- | --- | --- |
| Taille compressée | ≤ 20 Mo | [x,x Mo] |
| Temps 4G estimé (9 Mbit/s + 150 ms) | ≤ 3 s | [x,x s] |
| Embedding d'une requête (p95, Node) | ≤ 50 ms | [x,xxx ms] |
| Taux de succès à 3 vs mDenseOn (20 requêtes) | ≥ 0,8 | [0,xx] |

Configuration : [dims, word-prompt, --common]. Essais écartés : [liste].
```

- [ ] **Step 3: Suite complète**

Run: `pnpm exec biome check --write && pnpm lint && pnpm test && pnpm build`
Expected: biome sans diff, lint sans erreur, tous les tests au vert, build OK.

- [ ] **Step 4: Commit et PR**

```bash
git add .github/workflows/ci.yml scripts/distill/README.md
git commit -m "ci: lancer les tests ; docs: mesures et décision de L0

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin feat/v2-l0-embeddings
gh pr create --repo WillIsback/Portfolio --base main --head feat/v2-l0-embeddings \
  --title "feat(carnet): L0 — modèle statique distillé de mDenseOn et carte du carnet"
```

Corps de la PR : la table des mesures, la configuration retenue, les essais écartés, et la décision explicite (« recherche sémantique principale » si les quatre seuils sont tenus, sinon « mots-clés principaux, sémantique en amélioration différée »), en terminant par `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

---

## Partie L1 — identité (branche `feat/v2-l1-identity`)

### Task 8: Typographies du carnet

**Files:**
- Modify: `app/layout.tsx:1-12` et la balise `<body>`
- Modify: `app/globals.css` (bloc `@theme inline`, bloc `:root`, `@layer base`)

**Interfaces:**
- Produces: utilitaires Tailwind `font-display`, `font-serif`, `font-hand`, `font-mono` ; variables `next/font` `--font-bricolage`, `--font-source-serif`, `--font-caveat`, `--font-fira`.

- [ ] **Step 1: Créer la branche**

```bash
cd /home/will/dev-project/portfolio
git fetch origin
git switch -c feat/v2-l1-identity origin/docs/v2-carnet-spec
```

- [ ] **Step 2: Polices dans `app/layout.tsx`**

Remplacer l'import et les déclarations de polices (lignes 2 et 8-12) par :

```tsx
import { Bricolage_Grotesque, Caveat, Fira_Code, Source_Serif_4 } from "next/font/google";

const bricolage = Bricolage_Grotesque({
	subsets: ["latin"],
	weight: ["600", "700"],
	variable: "--font-bricolage",
	display: "swap",
});
const sourceSerif = Source_Serif_4({
	subsets: ["latin"],
	weight: ["400", "600"],
	style: ["normal", "italic"],
	variable: "--font-source-serif",
	display: "swap",
});
const caveat = Caveat({
	subsets: ["latin"],
	weight: ["500"],
	variable: "--font-caveat",
	display: "swap",
});
const firaCode = Fira_Code({
	subsets: ["latin"],
	weight: ["400", "500"],
	variable: "--font-fira",
	display: "swap",
});
```

et la classe de `<body>` par :

```tsx
className={`${bricolage.variable} ${sourceSerif.variable} ${caveat.variable} ${firaCode.variable} paper antialiased`}
```

- [ ] **Step 3: Familles dans `app/globals.css`**

Dans `@theme inline`, remplacer les deux lignes `--font-sans: var(--font-geist-sans);` et `--font-mono: var(--font-geist-mono);` par :

```css
  --font-display: var(--font-bricolage), system-ui, sans-serif;
  --font-serif: var(--font-source-serif), Georgia, "Times New Roman", serif;
  --font-hand: var(--font-caveat), "Segoe Print", cursive;
  --font-mono: var(--font-fira), ui-monospace, SFMono-Regular, monospace;
  --font-sans: var(--font-bricolage), system-ui, sans-serif;
```

Dans le bloc `:root`, supprimer les deux lignes `--font-display: "Space Grotesk", …` et `--font-mono: "Fira Code", …`.

Dans `@layer base`, remplacer la règle `body { … font-family: var(--font-display); … }` et la règle des titres par :

```css
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-serif);
    color: var(--text-body);
  }
  h1, h2, h3, h4 { font-family: var(--font-display); color: var(--text-strong); }
```

(laisser `code, pre { font-family: var(--font-mono); }` en place.)

- [ ] **Step 4: Vérifier le build**

Run: `pnpm build`
Expected: build OK ; `grep -c "Space Grotesk" -r app components` renvoie 0.

- [ ] **Step 5: Commit**

```bash
pnpm exec biome check --write app
git add app/layout.tsx app/globals.css
git commit -m "feat(identite): typographies du carnet (Bricolage, Source Serif 4, Caveat, Fira Code)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 9: Tokens du carnet et grille de papier

**Files:**
- Modify: `app/globals.css` (`@theme inline`, `:root`, `.dark`, nouvelle `@layer components`)
- Create: `lib/theme-tokens.test.ts`

**Interfaces:**
- Produces: tokens `--paper-grid`, `--ink-soft`, `--note` (clair et sombre) ; utilitaires `text-ink-soft`, `text-note`, `border-paper-grid` ; classe `paper` (posée sur `<body>` en Task 8).

- [ ] **Step 1: Écrire le test qui échoue**

`lib/theme-tokens.test.ts` :

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf8");

function block(selector: string): string {
	const match = css.match(new RegExp(`^${selector}\\s*\\{([\\s\\S]*?)^\\}`, "m"));
	if (!match) throw new Error(`bloc ${selector} introuvable`);
	return match[1];
}

describe("tokens du carnet", () => {
	it.each(["--paper-grid", "--ink-soft", "--note"])("%s est défini en clair et en sombre", (token) => {
		expect(block(":root")).toContain(`${token}:`);
		expect(block("\\.dark")).toContain(`${token}:`);
	});

	it("l'accent reste indigo en clair et violet en sombre", () => {
		expect(block(":root")).toContain("--primary: oklch(0.45 0.15 270)");
		expect(block("\\.dark")).toContain("--primary: oklch(0.65 0.22 270)");
	});
});
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

Run: `pnpm vitest run lib/theme-tokens.test.ts`
Expected: FAIL sur `--paper-grid` / `--ink-soft` / `--note` (l'accent passe déjà).

- [ ] **Step 3: Ajouter les tokens**

Dans le bloc `:root`, après `--brand-warm` :

```css
  /* Carnet de labo */
  --paper-grid: oklch(0.13 0.03 260 / 0.06);
  --ink-soft: oklch(0.45 0.04 262);
  --note: oklch(0.45 0.09 45);
```

Dans le bloc `.dark`, à la fin :

```css
  /* Carnet de nuit */
  --paper-grid: oklch(0.98 0.01 260 / 0.08);
  --ink-soft: oklch(0.76 0.03 262);
  --note: oklch(0.82 0.08 70);
```

Dans `@theme inline`, ajouter :

```css
  --color-paper-grid: var(--paper-grid);
  --color-ink-soft: var(--ink-soft);
  --color-note: var(--note);
```

- [ ] **Step 4: Grille de papier**

À la fin de `app/globals.css` :

```css
@layer components {
  /* Papier millimétré : grille fine tous les 6 px, trait plus marqué tous les 30 px, estompée vers le bas. */
  .paper {
    position: relative;
    isolation: isolate;
  }
  .paper::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background-image:
      linear-gradient(to right, var(--paper-grid) 1px, transparent 1px),
      linear-gradient(to bottom, var(--paper-grid) 1px, transparent 1px),
      linear-gradient(to right, var(--paper-grid) 1px, transparent 1px),
      linear-gradient(to bottom, var(--paper-grid) 1px, transparent 1px);
    background-size: 30px 30px, 30px 30px, 6px 6px, 6px 6px;
    mask-image: linear-gradient(to bottom, #000 0%, #000 35%, transparent 90%);
  }
}
```

- [ ] **Step 5: Relancer le test**

Run: `pnpm vitest run lib/theme-tokens.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
pnpm exec biome check --write app lib
git add app/globals.css lib/theme-tokens.test.ts
git commit -m "feat(identite): tokens du carnet et grille de papier millimétré

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 10: Primitives d'animation du carnet

**Files:**
- Create: `lib/motion.ts`
- Create: `components/notebook/InkPath.tsx`
- Create: `components/notebook/InkUnderline.tsx`
- Create: `components/notebook/MarginNote.tsx`
- Create: `components/notebook/FigureCaption.tsx`
- Create: `components/notebook/notebook.test.tsx`

**Interfaces:**
- Produces:
  - `INK_DRAW_SECONDS = 0.6`, `NOTE_DELAY_SECONDS = 0.25`, `EASE_INK = [0.65, 0, 0.35, 1] as const` (`lib/motion.ts`)
  - `<InkPath d: string; className?: string; strokeWidth?: number; delay?: number />` (à placer dans un `<svg>`)
  - `<InkUnderline>{children}</InkUnderline>`
  - `<MarginNote side?: "left" | "right">{children}</MarginNote>`
  - `<FigureCaption number: number>{children}</FigureCaption>`

- [ ] **Step 1: Écrire le test qui échoue**

`components/notebook/notebook.test.tsx` :

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import FigureCaption from "./FigureCaption";
import InkPath from "./InkPath";
import InkUnderline from "./InkUnderline";
import MarginNote from "./MarginNote";

describe("FigureCaption", () => {
	it("numérote la figure et garde la légende", () => {
		const html = renderToStaticMarkup(<FigureCaption number={2}>Carte des projets</FigureCaption>);
		expect(html).toContain("<figcaption");
		expect(html).toContain("Fig. 2 · ");
		expect(html).toContain("Carte des projets");
	});
});

describe("MarginNote", () => {
	it("rend une note manuscrite lisible comme du texte", () => {
		const html = renderToStaticMarkup(<MarginNote>essaie « vision »</MarginNote>);
		expect(html).toContain("<aside");
		expect(html).toContain("font-hand");
		expect(html).toContain("essaie « vision »");
	});
});

describe("InkPath", () => {
	it("rend un tracé à l'encre avec le chemin fourni", () => {
		const html = renderToStaticMarkup(
			<svg aria-hidden="true">
				<InkPath d="M0 0 L10 10" />
			</svg>,
		);
		expect(html).toContain('d="M0 0 L10 10"');
		expect(html).toContain('stroke="currentColor"');
		expect(html).toContain('fill="none"');
	});
});

describe("InkUnderline", () => {
	it("garde le texte souligné accessible et le trait décoratif masqué", () => {
		const html = renderToStaticMarkup(<InkUnderline>expériences</InkUnderline>);
		expect(html).toContain("expériences");
		expect(html).toContain('aria-hidden="true"');
	});
});
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

Run: `pnpm vitest run components/notebook/notebook.test.tsx`
Expected: FAIL (`Cannot find module './FigureCaption'`). Si Vitest refuse le JSX, ajouter `esbuild: { jsx: "automatic" }` à `vitest.config.ts` dans le même commit.

- [ ] **Step 3: Implémenter `lib/motion.ts`**

```ts
/** Langage d'animation du carnet (spec §5). */
export const INK_DRAW_SECONDS = 0.6;
export const NOTE_DELAY_SECONDS = 0.25;
export const EASE_INK = [0.65, 0, 0.35, 1] as const;
```

- [ ] **Step 4: Implémenter `InkPath.tsx`**

```tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE_INK, INK_DRAW_SECONDS } from "@/lib/motion";

interface InkPathProps {
	d: string;
	className?: string;
	strokeWidth?: number;
	delay?: number;
}

/** Trait d'encre qui se dessine une seule fois à sa première apparition. */
export default function InkPath({ d, className, strokeWidth = 1.6, delay = 0 }: Readonly<InkPathProps>) {
	const reduced = useReducedMotion();
	return (
		<motion.path
			d={d}
			className={className}
			fill="none"
			stroke="currentColor"
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
			initial={reduced ? false : { pathLength: 0 }}
			whileInView={{ pathLength: 1 }}
			viewport={{ once: true, margin: "-10% 0px" }}
			transition={{ duration: INK_DRAW_SECONDS, ease: EASE_INK, delay }}
		/>
	);
}
```

- [ ] **Step 5: Implémenter `InkUnderline.tsx`**

```tsx
import type { ReactNode } from "react";
import InkPath from "./InkPath";

/** Soulignement tracé à la main, à l'accent. */
export default function InkUnderline({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<span className="relative inline-block">
			{children}
			<svg
				aria-hidden="true"
				className="pointer-events-none absolute -bottom-1.5 left-0 h-2.5 w-full text-primary"
				viewBox="0 0 100 10"
				preserveAspectRatio="none"
			>
				<InkPath d="M2 6 C 22 2, 48 9, 70 5 S 92 4, 98 6" strokeWidth={2} />
			</svg>
		</span>
	);
}
```

- [ ] **Step 6: Implémenter `MarginNote.tsx`**

```tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NOTE_DELAY_SECONDS } from "@/lib/motion";

interface MarginNoteProps {
	children: ReactNode;
	side?: "left" | "right";
}

/**
 * Annotation manuscrite. Dans le flux du texte sur mobile ; dans la marge à partir de `xl`
 * (le parent doit être `relative`).
 */
export default function MarginNote({ children, side = "right" }: Readonly<MarginNoteProps>) {
	const reduced = useReducedMotion();
	return (
		<motion.aside
			className={cn(
				"font-hand text-lg leading-snug text-note my-3 xl:my-0 xl:absolute xl:top-0 xl:w-48",
				side === "right" ? "xl:-right-56" : "xl:-left-56 xl:text-right",
			)}
			initial={reduced ? false : { opacity: 0, y: 4 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.4, delay: NOTE_DELAY_SECONDS }}
		>
			{children}
		</motion.aside>
	);
}
```

- [ ] **Step 7: Implémenter `FigureCaption.tsx`**

```tsx
import type { ReactNode } from "react";

/** Légende de figure numérotée (« Fig. 2 · … »). */
export default function FigureCaption({ number, children }: Readonly<{ number: number; children: ReactNode }>) {
	return (
		<figcaption className="mt-3 font-mono text-xs tracking-wide text-ink-soft">
			Fig. {number} · {children}
		</figcaption>
	);
}
```

Attention : JSX rend `Fig. {number} · {children}` avec des marqueurs React entre les morceaux ; le test vérifie la chaîne `Fig. 2 · `, qui peut être coupée par `<!-- -->`. Si le test échoue pour cette raison, construire la chaîne explicitement : ``{`Fig. ${number} · `}{children}``.

- [ ] **Step 8: Relancer le test**

Run: `pnpm vitest run components/notebook/notebook.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 9: Commit**

```bash
pnpm exec biome check --write lib components/notebook vitest.config.ts
git add lib/motion.ts components/notebook vitest.config.ts
git commit -m "feat(identite): primitives d'animation du carnet (encre, note de marge, légende)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 11: En-tête fin et pied de page colophon

**Files:**
- Modify: `components/Header/Header.tsx` (remplacement complet)
- Modify: `components/Header/NavMenu.tsx` (remplacement complet)
- Modify: `components/Footer/Footer.tsx` (remplacement complet)
- Modify: les conteneurs de `<Header>` dans les pages (voir step 4)

**Interfaces:**
- Consumes: `ThemeToggle` (existant), `Button` (`components/ui/button`), `cn`.
- Produces: `Header` et `NavMenu` gardent les props `highlightContact: boolean` et `contactBtnRef?: React.RefObject<HTMLButtonElement | null>` (l'animation actuelle de l'accueil les utilise jusqu'à L2).

- [ ] **Step 1: `Header.tsx`**

```tsx
import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";
import NavMenu from "./NavMenu";

interface HeaderProps {
	highlightContact: boolean;
	contactBtnRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function Header({ highlightContact = false, contactBtnRef }: Readonly<HeaderProps>) {
	return (
		<header className="w-full border-b border-border/70 bg-background/85 backdrop-blur">
			<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
				<Link href="/" className="flex items-baseline gap-3 transition-opacity hover:opacity-80">
					<span className="font-display text-lg font-semibold tracking-tight text-foreground">
						William Derue
					</span>
					<span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
						Carnet de labo
					</span>
				</Link>
				<div className="flex items-center gap-1 sm:gap-2">
					<NavMenu highlightContact={highlightContact} contactBtnRef={contactBtnRef} />
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
```

- [ ] **Step 2: `NavMenu.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavMenuProps {
	highlightContact: boolean;
	contactBtnRef?: React.RefObject<HTMLButtonElement | null>;
}

const LINKS = [
	{ href: "/", label: "Carnet", isActive: (p: string) => p === "/" },
	{ href: "/articles", label: "Articles", isActive: (p: string) => p.startsWith("/articles") },
	{ href: "/About", label: "À propos", isActive: (p: string) => p === "/About" },
	{ href: "/Contact", label: "Contact", isActive: (p: string) => p === "/Contact" },
];

export default function NavMenu({ highlightContact, contactBtnRef }: Readonly<NavMenuProps>) {
	const pathname = usePathname() ?? "/";
	return (
		<nav aria-label="Navigation principale">
			<ul className="flex flex-wrap items-center gap-0.5 sm:gap-1">
				{LINKS.map((link) => {
					const active = link.isActive(pathname);
					const isContact = link.href === "/Contact";
					return (
						<li key={link.href}>
							<Button
								ref={isContact ? contactBtnRef : undefined}
								asChild
								variant="ghost"
								size="sm"
								className={cn(
									"rounded-none border-b-2 border-transparent px-2 font-display text-sm font-semibold transition-colors sm:px-3",
									active
										? "border-primary text-foreground"
										: "text-ink-soft hover:border-paper-grid hover:text-foreground",
									isContact && highlightContact && "border-primary text-primary",
								)}
							>
								<Link href={link.href} aria-current={active ? "page" : undefined}>
									{link.label}
								</Link>
							</Button>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
```

- [ ] **Step 3: `Footer.tsx`**

```tsx
import Link from "next/link";

export default function Footer() {
	return (
		<footer className="mt-16 w-full border-t border-border/70">
			<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 font-mono text-xs text-ink-soft sm:px-6">
				<p>Carnet tenu par William Derue · © {new Date().getFullYear()}</p>
				<nav aria-label="Liens du pied de page" className="flex items-center gap-4">
					<Link href="/articles" className="hover:text-primary">
						Articles
					</Link>
					<Link href="https://github.com/WillIsback/" className="hover:text-primary">
						GitHub
					</Link>
				</nav>
			</div>
		</footer>
	);
}
```

- [ ] **Step 4: Conteneurs de l'en-tête dans les pages**

Run: `grep -rn "<Header" app --include='*.tsx'`

Pour chaque fichier listé, le parent direct de `<Header` est un conteneur collant avec des marges (par ex. dans `app/page.tsx` : `<div className="sticky top-0 z-50 flex w-full justify-center p-3 sm:p-6">`). Remplacer sa classe par `sticky top-0 z-50 w-full` pour que l'en-tête fin occupe toute la largeur. Ne rien changer d'autre dans ces pages.

- [ ] **Step 5: Vérifier**

Run: `pnpm exec biome check --write && pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build`
Expected: tout au vert. (`tsc` après `build`, qui génère `next-env.d.ts` dans une copie de travail neuve.)

- [ ] **Step 6: Commit**

```bash
git add components/Header components/Footer app
git commit -m "feat(identite): en-tête fin du carnet et pied de page colophon

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 12: Revue visuelle, CI et PR L1

**Files:**
- Modify: `.github/workflows/ci.yml` (si Task 7 n'est pas encore mergée)

**Interfaces:**
- Produces: PR `feat/v2-l1-identity`.

- [ ] **Step 1: Tests en CI**

Si `.github/workflows/ci.yml` ne contient pas encore l'étape `Run tests` (Task 7 non mergée), l'ajouter après `Check for uncommitted changes` :

```yaml
      - name: Run tests
        run: pnpm test
```

- [ ] **Step 2: Captures**

Lancer `PORT=3470 pnpm start` (après `pnpm build`), capturer `/`, `/articles/neuf-agents-neuf-jours`, `/About`, `/Contact` à 390 et 1280 px, en clair et en sombre (bouton de thème ou `prefers-color-scheme`), dans un dossier temporaire hors des dépôts. Vérifier : grille visible et estompée vers le bas, titres en Bricolage, corps en Source Serif, aucune police de repli visible, accent indigo/violet, contraste lisible (aucun texte clair sur clair ou sombre sur sombre), aucun défilement horizontal, en-tête sur toute la largeur. Corriger en une passe, puis arrêter le serveur (`kill` du PID qui écoute sur 3470).

- [ ] **Step 3: Lighthouse**

Sur la prévisualisation Vercel de la PR (après push), mesurer l'accueil en mobile et comparer au site actuel : pas de régression du score Performance (polices).

- [ ] **Step 4: Commit et PR**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: lancer les tests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || true
git push -u origin feat/v2-l1-identity
gh pr create --repo WillIsback/Portfolio --base main --head feat/v2-l1-identity \
  --title "feat(identite): L1 — identité « carnet de labo »"
```

Corps de la PR : changements (polices, tokens, grille, primitives, en-tête, pied de page), vérifications, captures commentées, mesure Lighthouse, en terminant par `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
