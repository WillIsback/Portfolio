# Domaines IA/Data des projets — spec

Spécification · 2026-10-10 · validée par William en conversation (questions et tableau d'étiquetage).

## Intention
Donner aux projets du registre des métadonnées « domaine IA/Data » fiables, pour mieux mettre le ML en avant (projets phares, filtres, recherche du carnet) — en remplaçant les cases `isML` / `isIAG`, jamais cochées.

## Décisions
- **Liste fermée** (enum Prisma `AiDomain`) : `DataAnalysis`, `ML`, `Classifier`, `Regressor`, `LLM`, `Vision`, `NLP`, `Agents`, `Speech`.
- **Libellés affichés** : Data analyse, ML, Classification, Régression, LLM, Vision, NLP, Agents, Parole.
- **Table de liaison** `ProjectDomain (projectId, domain)`, unique par couple, cascade à la suppression — même forme que `ProjectLanguage`.
- **Règle métier** : `Classifier` ou `Regressor` implique `ML` (appliquée à l'enregistrement et par le script d'étiquetage).
- **`isML` et `isIAG` sont retirés** (schéma, code, admin, base). Retrait en deux temps : ajout (table + enum) avant le merge, suppression des colonnes après le déploiement du code qui ne les lit plus.
- **Projets phares** : la règle devient « au moins un domaine », du plus récent au plus ancien ; liste explicite `lib/featured.ts` prioritaire ; complément jusqu'à 4 par les projets publics récents conservé en secours.
- **Registre** : puces de domaines sur les cartes phares et les lignes d'index ; filtre « Domaine » (serveur + interface), comme les autres filtres.
- **Admin** : neuf cases à cocher remplacent `isML` / `isIAG`.
- **Carte du carnet** : les libellés de domaines s'ajoutent aux **mots-clés** des projets, pas au texte qui sert au calcul des vecteurs (la carte garde sa forme ; seuls `keywords` et `search-items.json` changent après `pnpm embeddings`).
- **Étiquetage initial** (validé) : appliqué par un script idempotent avec essai à blanc par défaut.

| # | Projet | Domaines |
|---|---|---|
| 1 | Abricot.co | LLM |
| 2 | CLEA API | LLM, NLP |
| 6 | OC-P10 TechNova | DataAnalysis, ML, Classifier |
| 8 | P8 Bottleneck | DataAnalysis |
| 9 | OC-P7 DataImmo | DataAnalysis, ML, Regressor |
| 12 | Fashion Trend Intelligence | Vision |
| 13 | AI Report Maker | Speech, LLM, NLP |
| 14 | LLM Summarizer Trainer | LLM, NLP, ML |
| 16 | p12-phase2-zenassist | LLM, NLP, Classifier (+ ML par la règle) |
| 17 | p12-phase1-zenassist | ML, Classifier, NLP, LLM |
| 18 | p12 ModernBERT | ML, Classifier, NLP |
| 19 | P14-NewsFoundry | LLM |
| 20 | Syntheo | Speech, LLM |
| 21 | whisperx-gb10 | Speech |
| 22 | ai_corrector | LLM, NLP |
| 24 | code-review | LLM, Agents |
| 25 | docgen-rs | LLM |
| 26 | P13-Fashion-Insta | ML, Vision |

Aucun domaine : 3, 4, 5, 7, 10, 11, 15 (privé), 23.

## Contraintes
- Base Neon de production : `prisma db push` (pas de migrations dans le dépôt) ; client généré committé (`prisma/generated`) — à régénérer et committer.
- Aucun accès à la base pendant le build ; le registre reste chargé à l'exécution.
- HTML de l'accueil < 14 600 o gzip.
- Accessibilité AA, textes en français.
