# Modèle statique du carnet

Distillation de `lightonai/mDenseOn` en embeddings statiques par mot (méthode model2vec :
un embedding par mot calculé par le professeur, PCA, pondération SIF, quantification int8 par ligne),
pour la recherche sémantique de la Fig. 1, exécutée dans le navigateur du visiteur.

## Régénérer

    pnpm carnet:corpus                      # export du corpus (base + articles) -> scripts/distill/corpus.json
    cd scripts/distill
    uv run python build_vocab.py --common 10000
    uv run python distill.py --dims 128 --word-prompt none   # --device cuda sur le DGX
    uv run python evaluate.py               # accord avec mDenseOn, taille, 4G estimé
    cd ../.. && pnpm carnet:bench           # latence
    pnpm embeddings                          # content/map.json

## Mesures retenues

| Critère | Seuil | Mesure |
| --- | --- | --- |
| Taille compressée | ≤ 20 Mo | 2,2 Mo |
| Temps 4G estimé (9 Mbit/s + 150 ms) | ≤ 3 s | 2,09 s |
| Embedding d'une requête (p95, Node) | ≤ 50 ms | 0,030 ms (p50 0,003 ms) |
| Taux de succès à 3 vs mDenseOn (20 requêtes) | ≥ 0,8 | 0,90 (overlap@3 0,62) |

Professeur : `lightonai/mDenseOn` épinglé à la révision `a5fdb000f7a21da96c3bddde3a782ef777316df3`
(`TEACHER_REVISION` dans `carnet_static.py`, recopiée dans `meta.json` sous `teacherRevision`).

Configuration : dims 128, word-prompt none, --common 10000 (17416 mots).
Distillation : 132 s sur le CPU du home-server (16 cœurs), pas de GPU nécessaire.

Essai écarté : --common 20000 (33760 mots) → hit@3 0,95, overlap@3 0,65, 4,2 Mo, 4G 3,91 s
(échec du seuil de 3 s).

## Décision

Recherche sémantique principale : les quatre seuils sont tenus.

Réserves : hit@3 = 0,90 est mesuré sur 20 requêtes du même corpus de 26 documents (granularité 0,05,
marge de 2 requêtes sur le seuil de 0,8). Les fichiers .i8/.f32 peuvent être servis non compressés
(pire cas ≈ 2,36 Mo, ≈ 2,25 s en 4G, toujours sous 3 s) : à vérifier sur la prévisualisation en L2.
