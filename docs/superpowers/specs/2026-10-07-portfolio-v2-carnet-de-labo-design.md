# Portfolio V2 — « Carnet de labo »

Spécification de design · 2026-10-07 · statut : à relire

## 1. Intention

**Public.** Des pairs (développeurs, ingénieurs ML) : le site est une vitrine technique, pas un argumentaire de recrutement ni une offre commerciale.

**Ce que le visiteur doit vivre en 10 secondes.** Entrer dans un labo vivant : une expérience ML réelle et interactive dès l'accueil, qui fait comprendre le métier en jouant avec.

**Direction visuelle.** Un carnet de labo : papier clair à grille millimétrée, encre bleu-noir, un seul accent indigo (violet en mode sombre, « carnet de nuit »), annotations manuscrites dans la marge, figures légendées.

**Pourquoi.** Le site actuel est jugé fade : une seule idée visuelle à l'accueil, un bloc compétences en murs de listes qui occupe la moitié de la page, une trentaine de projets illustrés par le même logo GitHub, aucune hiérarchie, des articles absents de l'accueil.

**Critères de réussite.**
- Un visiteur tape un sujet dans le champ de l'accueil et voit, sur une carte de mes projets et articles, son point se poser et les trois éléments les plus proches s'allumer, en moins de 3 s après sa première interaction sur une connexion 4G.
- Le ML est au premier plan : la première figure du site est un modèle d'embeddings qui tourne dans le navigateur.
- L'accueil se lit comme un carnet : expérience, entrées (articles), registre des projets, instruments.
- Aucune régression du score Lighthouse mobile face à la version actuelle ; LCP mobile < 2,5 s sur la prévisualisation Vercel.

## 2. Hors périmètre

- Les données du catalogue de projets (base Postgres) : aucune modification de schéma ni de contenu. Seule leur présentation change.
- L'espace d'administration.
- Le contenu des articles existants (seul leur rendu change).
- Les nouveaux articles rétrospectifs (sujet séparé, liste fournie plus tard par William).
- Flux RSS, internationalisation, analytics.

## 3. Prérequis

Les PR #4 (thème : accent et mode sombre) et #5 (parcours, pied de page, titres) sont mergées avant toute livraison V2. La V2 réutilise la mécanique de thème de #4 (`next-themes`, tokens unifiés dans `globals.css`).

## 4. Identité

### 4.1 Typographie

| Rôle | Police | Usage |
| --- | --- | --- |
| Titres | Bricolage Grotesque | Titres de sections, titres d'entrées, nom dans l'en-tête |
| Lecture longue | Source Serif 4 | Corps des articles, descriptions de projets, présentation |
| Annotations | Caveat | Notes de marge uniquement, au plus 2 à 3 par écran |
| Données | Fira Code (déjà en place) | Dates, scores, étiquettes de la carte, légendes de figures |

Chargement par `next/font/google`, sous-ensemble `latin`, uniquement les graisses utilisées (Bricolage 600/700, Source Serif 400/600 + italique 400, Caveat 500, Fira Code 400/500). Space Grotesk est retirée.

### 4.2 Palette (tokens)

Les tokens de #4 restent la source de vérité ; la V2 en ajuste les valeurs et en ajoute trois.

| Token | Clair (carnet) | Sombre (carnet de nuit) |
| --- | --- | --- |
| `--background` (papier) | blanc froid légèrement bleuté | bleu nuit profond |
| `--foreground` (encre) | bleu-noir | craie (blanc bleuté) |
| `--primary` (accent) | indigo `oklch(0.45 0.15 270)` | violet `oklch(0.65 0.22 270)` |
| `--paper-grid` (nouveau) | ligne de grille, ~6 % d'opacité de l'encre | ligne de grille, ~8 % d'opacité de la craie |
| `--ink-soft` (nouveau) | encre secondaire pour traits et légendes | idem en sombre |
| `--note` (nouveau) | couleur des annotations manuscrites (encre légèrement plus chaude) | idem en sombre |

Contraste AA vérifié pour toute paire texte/fond dans les deux thèmes.

### 4.3 Motifs du carnet

Chaque motif encode une information réelle :
- **Grille millimétrée** en fond de page, très discrète, qui s'estompe vers le bas de l'écran.
- **Légendes de figure** numérotées automatiquement (« Fig. 1 · Carte de mes projets et articles »).
- **Entrées datées** : date en Fira Code devant chaque article.
- **Notes de marge** manuscrites, reliées au texte par une flèche tracée ; sur mobile, elles s'insèrent dans le flux du texte.
- **Numéros** uniquement là où il y a une vraie chronologie (entrées du carnet, étapes du parcours).

## 5. Langage d'animation

Bibliothèque : `framer-motion`, déjà installée. Aucune nouvelle bibliothèque d'animation.

1. **L'encre se dessine.** Soulignements, flèches, axes et schémas se tracent à leur première apparition (animation de `pathLength`, ~600 ms, une seule fois par élément).
2. **Les annotations arrivent après le contenu**, avec ~250 ms de décalage, comme une main qui annote une page déjà écrite.
3. **Un seul grand moment orchestré** : à l'arrivée sur l'accueil, les axes de la Fig. 1 se tracent, puis les points apparaissent groupe thématique par groupe thématique (~1,2 s au total). Au repos, les points « respirent » (variation d'opacité ou d'échelle de quelques pour cent, lente).
4. **Pas de parallaxe ni d'effet gratuit.**
5. **`prefers-reduced-motion`** : tout est visible immédiatement dans son état final, aucun mouvement, aucune respiration.

Le contenu est complet au repos : aucun élément n'attend une animation pour être lisible (pas d'`opacity: 0` en attente d'un observateur).

## 6. Accueil

Ordre de haut en bas :

1. **En-tête** fin et collant : nom, mention « Carnet de labo », navigation (Carnet, Articles, À propos, Contact), bouton de thème.
2. **Ouverture — Fig. 1** (au-dessus de la ligne de flottaison sur desktop) :
   - à gauche : présentation courte (« William Derue, développeur IA en parcours AI Engineer. Ce carnet consigne mes expériences : modèles entraînés, agents, infrastructure. ») et champ de saisie « Décris un sujet : vision, LLM local, agents… » ;
   - à droite : la carte (section 7), sa légende, et sous elle la liste des trois résultats les plus proches ;
   - une note de marge invite à essayer ;
   - mobile : présentation, saisie, carte carrée, résultats, empilés.
   L'animation actuelle du message qui vole vers le bouton Contact (`HeroPrompt` + chemin SVG) est retirée.
3. **Dernières entrées** : les trois articles les plus récents (date, titre, résumé d'une phrase, temps de lecture, thèmes) et un lien vers toutes les entrées.
4. **Registre des projets** :
   - **Projets phares** (4 à 6) en grandes cartes avec figure (section 8). Sélection par défaut : projets marqués `isML` ou `isIAG` dans la base, du plus récent au plus ancien (`lastUpdate`), projets privés exclus. Une liste explicite d'identifiants dans `lib/featured.ts`, vide au départ, remplace la règle par défaut quand elle est renseignée.
   - **Index** : tous les autres projets en lignes compactes (nom, une ligne, technologies, année). Les filtres existants restent disponibles, repliés par défaut.
5. **Instruments** : quatre lignes compactes, dans l'ordre Data & ML, back-end, front-end, DevOps ; logos et noms sur une ligne ; le détail des bibliothèques derrière une divulgation « voir le détail ». L'animation des cubes empilés est retirée.
6. **Pied de page en colophon** : « Carnet tenu par William Derue · © <année> », liens GitHub et Articles.

## 7. Fig. 1 — la carte d'embeddings

### 7.1 Modèle : distillation de mDenseOn en embeddings statiques

- **Professeur** : `lightonai/mDenseOn` (variante à vecteur unique de la famille mLateOn de LightOn, multilingue). mLateOn lui-même est écarté : multi-vecteurs (ColBERT), donc inadapté à une projection 2D, et 313 Mo en ONNX int8.
- **Élève** : un modèle statique par mot, distillé selon la méthode de `model2vec` (un embedding par mot calculé par le professeur, réduction PCA, pondération SIF, quantification int8 par ligne ; embedding d'un texte = moyenne normalisée des vecteurs de ses mots connus). La méthode est implémentée directement : `model2vec` 0.9 ajoute le vocabulaire au tokenizer sous-mots de mmBERT (256 000 tokens), trop lourd pour le navigateur. Vocabulaire : mots du corpus du site puis mots courants en français et en anglais.
- **Où** : distillation exécutée une fois, hors ligne, sur le DGX Spark (Python). Aucune inférence côté serveur en production.
- **Artefacts versionnés dans le dépôt** :
  - `public/models/carnet-static/` : vecteurs du modèle et tokenizer, servis comme fichiers statiques par Vercel ;
  - `scripts/distill/` : script Python de distillation et requêtes de mesure, pour la reproductibilité.

### 7.2 Mesure de L0 (décision d'avancer)

Mesures sur 20 requêtes test (10 en français, 10 en anglais) rédigées à l'avance dans `scripts/distill/queries.json` ; la référence est le classement de mDenseOn complet (prompts `query: ` / `document: `). La taille compressée est mesurée, le temps 4G est calculé (9 Mbit/s, latence 150 ms), le calcul d'embedding est mesuré dans Node ; la vérification en navigateur réel se fait en L2 (Lighthouse sur la prévisualisation) :

| Critère | Seuil |
| --- | --- |
| Taille téléchargée du modèle + tokenizer (compressé) | ≤ 20 Mo |
| Délai entre le focus du champ et la première réponse sémantique, 4G simulée | ≤ 3 s |
| Calcul d'un embedding de requête, modèle chargé | ≤ 50 ms |
| Accord avec mDenseOn complet : taux de succès à 3 (part des requêtes où le top 3 de l'élève contient le top 1 du professeur) | ≥ 0,8 |

**Décision.** Si tous les seuils sont tenus, la recherche sémantique est l'expérience principale. Sinon, la correspondance par mots-clés (7.4) devient l'expérience principale et la sémantique une amélioration chargée en différé ; le reste du design ne change pas. La décision et les chiffres sont consignés dans la PR de L0.

**Tokenisation.** Un tokenizer par mot minimal (normalisation NFKD, suppression des diacritiques, minuscules, mots `[a-z0-9]+` d'au moins 2 caractères), écrit à l'identique en Python (distillation) et en TypeScript (build et navigateur) ; un test de parité compare tokens et embeddings des deux implémentations. Les mots inconnus sont ignorés ; une requête sans aucun mot connu bascule sur la correspondance par mots-clés.

### 7.3 Préparation du corpus (`pnpm embeddings`)

Commande Node, lancée à la main quand le contenu change :
1. Lit les articles (`content/articles/*.mdx` : titre, description, thèmes) et les projets (base via Prisma : titre, description, technologies ; projets privés exclus). Nécessite `DATABASE_URL` en local.
2. Calcule l'embedding de chaque élément avec le modèle statique.
3. Projette en 2D avec UMAP (`umap-js`, graine fixée pour la stabilité entre deux générations), normalise les coordonnées dans [0, 1].
4. Regroupe les éléments par k-means (k = 5 par défaut) et propose un nom de groupe à partir des technologies dominantes.
5. Écrit `content/map.json`, versionné :

```json
{
  "model": "carnet-static@<hash>",
  "generatedAt": "2026-10-07T00:00:00Z",
  "clusters": [{ "id": "c1", "label": "LLM et agents" }],
  "items": [
    {
      "id": "article:neuf-agents-neuf-jours",
      "kind": "article",
      "title": "Neuf agents, neuf jours",
      "href": "/articles/neuf-agents-neuf-jours",
      "x": 0.71, "y": 0.34,
      "cluster": "c1",
      "keywords": ["agents", "sre", "llm"],
      "vector": [0.012, -0.034]
    }
  ]
}
```

Les noms de groupes proposés sont remplacés à la main dans `content/map-clusters.ts` (clé = identifiant de groupe).

Le build Vercel ne recalcule rien et n'accède pas à la base : il lit `content/map.json`. Un test vérifie que chaque article publié figure dans `map.json`.

### 7.4 Comportement dans le navigateur

- **Chargement différé** : le modèle est récupéré dans un Web Worker au premier focus ou survol du champ de saisie (ou au premier geste tactile sur la carte), puis mis en cache par le navigateur.
- **Repli par mots-clés, immédiat** : tant que le modèle n'est pas prêt, la saisie est comparée aux `keywords` des éléments (normalisation des accents et de la casse) ; les éléments correspondants s'allument. Quand le modèle est prêt, la recherche passe en sémantique, signalée par une mention discrète (« recherche sémantique active »).
- **Placement de la requête** : similarité cosinus entre l'embedding de la requête et chaque élément ; le point de la requête est placé à la moyenne des positions des 5 plus proches, pondérée par leur similarité. Les 3 plus proches s'allument et sont listés sous la carte avec leur score (« 0,82 »).
- **Saisie vide** : la carte revient à son état de repos.

### 7.5 Rendu

- SVG (moins de 100 points), rendu côté serveur avec les positions de `map.json` : la carte est visible dès le HTML ; l'interactivité est un îlot client.
- Rond = projet, carré = article ; groupes signalés par une teinte d'encre et une étiquette en Fira Code ; point de requête et résultats à l'accent.
- Survol ou focus d'un point : info-bulle (titre, type) ; clic : ouvre l'article, ou le dépôt GitHub du projet (les projets n'ont pas de page dédiée).
- Accessibilité : `role="img"` avec une description ; une liste équivalente des éléments, navigable au clavier, double la carte ; les résultats sont annoncés dans une région `aria-live="polite"`.

## 8. Projets, articles, À propos, Contact

### 8.1 Figures des projets

Uniquement des données réelles ; aucune courbe ou métrique inventée.
- **Mini-carte** : la Fig. 1 en réduction, le projet allumé parmi ses voisins (coordonnées de `map.json`).
- **Barre de composition technique** : proportions des technologies associées au projet en base (langages, base de données, back-end, front-end, DevOps).
- **Capture réelle** : si le projet a une `imagePath` qui n'est pas l'image GitHub par défaut, elle remplace la mini-carte.

Cartes de projets phares : figure, titre, une phrase, technologies, liens GitHub et « Lire l'entrée du carnet » quand un article mentionne le projet (correspondance par champ `projects` facultatif dans le frontmatter des articles).

### 8.2 Articles

- Page de liste : entrées datées, même style que l'accueil.
- Page article : corps en Source Serif 4 ; graphiques existants restylés à l'encre sur grille ; figures numérotées automatiquement.
- Composant MDX `<Note>` : annotation manuscrite en marge sur desktop, insérée dans le texte sur mobile ; contenu textuel normal pour les lecteurs d'écran.
- **« Sur la carte »** en fin d'article : mini-carte et trois liens vers les éléments les plus proches dans `map.json` (similarité cosinus des vecteurs stockés).
- Le frontmatter accepte un champ facultatif `projects: number[]` (identifiants de projets en base) pour lier un article à des projets.

### 8.3 À propos

Chronologie de carnet : la ligne du temps se trace à l'encre au fil du défilement ; chaque étape avec sa date en Fira Code. Contenu du parcours inchangé (celui de la PR #5).

### 8.4 Contact

Réhabillage en fiche du carnet ; logique d'envoi inchangée.

## 9. Qualité

- **Performances** : accueil statique ; seuls la carte et le champ sont des composants client ; modèle chargé en différé dans un Worker ; budgets de la section 1.
- **Accessibilité** : AA dans les deux thèmes, focus visible, navigation clavier complète de la carte, `prefers-reduced-motion`, `lang="fr"`.
- **Tests** (Vitest) : tokenisation et moyenne d'embeddings (identiques build/navigateur), interpolation de la position de requête, repli par mots-clés, validation de `map.json` et de `map-clusters.ts`, sélection des projets phares, construction des figures, numérotation des figures, présence de chaque article dans `map.json`.
- **CI** : ajout de `pnpm test` au workflow existant (qui ne lance que biome).
- **Revue visuelle** à chaque livraison : captures 390 et 1280 px, clair et sombre, avant l'ouverture de la PR ; Lighthouse sur la prévisualisation pour L2 et L3.

## 10. Livraisons

Chaque livraison = une branche, une PR, une prévisualisation Vercel, un merge par William.

| # | Livraison | Contenu | Dépend de |
| --- | --- | --- | --- |
| L0 | Mesure et distillation | Distillation sur le DGX, mesures 7.2, décision, `pnpm embeddings`, `content/map.json`, tests du calcul. Aucune interface. | #4, #5 |
| L1 | Identité | Typographies, tokens du carnet, grille, en-tête fin, pied de page colophon, primitives d'animation (tracé d'encre, note de marge) appliquées à tout le site sans changer la structure. | #4, #5 (en parallèle de L0) |
| L2 | Fig. 1 | Ouverture de l'accueil : carte SVG, Worker, repli par mots-clés, saisie, résultats ; retrait de `HeroPrompt`. | L0, L1 |
| L3 | Reste de l'accueil | Dernières entrées, registre (phares avec figures, index, filtres repliés), Instruments ; retrait du bloc compétences actuel. | L0, L1 |
| L4 | Articles, À propos, Contact | Typographie de lecture, `<Note>`, figures numérotées, « Sur la carte », chronologie tracée, contact réhabillé. | L1 (L0 pour « Sur la carte ») |

## 11. Risques

| Risque | Parade |
| --- | --- |
| Qualité insuffisante du modèle statique sur des phrases longues | Requêtes courtes encouragées par le texte d'aide ; décision chiffrée en L0 ; repli par mots-clés toujours disponible |
| Mots absents du vocabulaire (jargon, fautes de frappe) | Vocabulaire du corpus + 10 000 mots courants FR et EN (réduit de 20 000 à 10 000 pour tenir le seuil des 3 s en 4G) ; repli par mots-clés quand aucun mot n'est connu |
| Carte qui change de forme à chaque régénération | Graine UMAP fixée ; régénération uniquement quand le contenu change |
| `map.json` en retard sur le catalogue | Commande documentée dans le README ; test sur les articles ; projets ajoutés rarement |
| Quatre familles de polices alourdissent le chargement | Sous-ensemble latin, graisses limitées, `display: swap` ; mesure Lighthouse en L1 |
