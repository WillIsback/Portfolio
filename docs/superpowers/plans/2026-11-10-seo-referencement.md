# Référencement et SEO de willisback.fr : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que les recherches « william derue », « willisback » et les noms de projets remontent le portfolio de façon fiable.

**Architecture:** d'abord ce qui empêche Google de découvrir et de comprendre le site (robots, sitemap, données structurées, redirection permanente, Search Console), ensuite des pages projet indexables. Tout le SEO technique passe par les conventions de fichiers de métadonnées de Next 16 (`app/robots.ts`, `app/sitemap.ts`, `opengraph-image.tsx`) et par `lib/seo.ts`, qui reste la source unique des URL.

**Tech Stack:** Next.js 16.3 (App Router, `MetadataRoute`, `next/og`), next-intl 4 (`localePrefix: "as-needed"`), Vitest.

**Spec:** ce document (section « Audit du 10 novembre 2026 ») ; pas de spec séparée pour le lot 1. Le lot 2 demande sa propre spec.

## Audit du 10 novembre 2026

Mesuré sur la production :

| Constat | Effet |
| --- | --- |
| `/robots.txt` et `/sitemap.xml` répondent **404** | Google ne découvre les pages que par les liens ; les articles et les versions EN/ZH peuvent rester inconnus. |
| `willisback.fr` → `www.willisback.fr` en **307** (temporaire) | Google peut hésiter entre les deux hôtes et diluer les signaux ; il faut un 308. |
| **Aucune donnée structurée** sur l'accueil et « À propos » (seuls les articles ont un `BlogPosting`) | Google n'associe pas explicitement « William Derue », « WillisBack » et le site : rien pour une fiche d'entité. |
| **Aucune image de partage** (`og:image`), alors que `twitter:card` vaut `summary_large_image` | Aperçus pauvres sur LinkedIn, X, Slack ; moins de clics, moins de liens entrants. |
| « WillisBack » n'apparaît que dans `og:site_name` (« Portfolio WillisBack ») | La requête « willisback » ne s'appuie que sur le nom de domaine. |
| **Les projets n'ont pas de page** : le registre de l'accueil renvoie vers GitHub | Aucune URL du site ne peut se classer sur un nom de projet ; c'est GitHub qui capte ces requêtes. |
| Profil GitHub : nom « Will », site `willisback.fr` sans `www` | Le profil le plus visible ne porte pas le nom complet ; le lien passe par la redirection 307. |
| `meta keywords` présent | Ignoré par Google ; contient « développeur fullstack », qui ne correspond plus au positionnement. |

Déjà correct : titres et descriptions par page, `canonical` et `hreflang` par locale (y compris `x-default`), rendu statique, `BlogPosting` sur les articles, `/about` canonicalisé vers `/About`.

## Global Constraints

- Origine canonique : `https://www.willisback.fr` (`SITE_URL` de `lib/seo.ts`). Toute URL produite passe par `canonicalUrl(locale, path)`.
- Locales : `fr` (racine, sans préfixe), `en`, `zh`. Chemins exacts des pages : `""`, `/About`, `/Contact`, `/articles`, `/articles/<slug>` (majuscules conservées : ce sont les canonicals actuels).
- Une URL de locale n'entre dans le sitemap que si la page existe dans cette langue (article traduit présent dans `content/articles/<locale>/`).
- `/admin` et `/api` ne sont jamais indexés.
- Nom de marque : « WillisBack » ; variantes acceptées pour `alternateName` : « willisback », « Will Is Back ».
- Identifiant d'entité de la personne : `https://www.willisback.fr/#person` ; du site : `https://www.willisback.fr/#website`.
- Profils `sameAs` : `https://github.com/WillIsback`. Ajouter le LinkedIn **seulement** si William fournit l'URL.
- JSON-LD sérialisé avec `.replace(/</g, "\\u003c")`, comme dans la page article.
- Workflow : lot `feat/0.3.0`, une sous-branche par tâche, une PR vers `main`.

## Review Focus

1. **Le proxy next-intl ne doit pas capter `robots.txt`, `sitemap.xml` ni les images OG.** Les deux premiers sont exclus par le motif `.*\\..*` du `matcher`, mais l'image OG n'a pas d'extension : la vérification de la tâche 4 doit obtenir `200 image/png` sur `/opengraph-image` et `/en/opengraph-image`.
2. **Article sans traduction** : `/zh/articles/<slug>` sert le français en repli. Le sitemap ne doit lister que les URL traduites. C'est testé dans la tâche 2 avec un dossier de locale vide.
3. **Casse des chemins** : le sitemap doit écrire `/About` et `/Contact`, exactement comme les canonicals, sinon Google voit deux URL. C'est testé dans la tâche 2.
4. **Admin** : aucune URL `/admin` ni `/api` dans le sitemap, et les deux sont interdites dans `robots.txt`. C'est testé dans les tâches 1 et 2.
5. **Injection dans le JSON-LD** : un titre contenant `</script>` ne doit pas fermer la balise. C'est testé dans la tâche 3.

---

## Lot 0 — Actions manuelles (William, hors code)

Ces actions ne demandent pas de PR. Les trois premières sont les plus rentables du plan.

- [ ] **Vercel › Domains** : passer la redirection `willisback.fr` → `www.willisback.fr` de « Temporary (307) » à **« Permanent (308) »**. Vérifier : `curl -sI https://willisback.fr | head -1` affiche `308`.
- [ ] **Google Search Console** : créer une propriété **Domaine** `willisback.fr` (vérification par enregistrement DNS TXT chez le registraire). Après le lot 1, soumettre `https://www.willisback.fr/sitemap.xml`, puis demander l'indexation de `/`, `/About`, `/articles` et des trois articles.
- [ ] **Bing Webmaster Tools** : importer la propriété depuis Search Console et soumettre le même sitemap. Bing alimente aussi DuckDuckGo et plusieurs moteurs de réponse par IA.
- [ ] **Profil GitHub** : nom « William Derue », site `https://www.willisback.fr`, une bio d'une ligne. Mettre aussi `https://www.willisback.fr` (avec `www`) dans le champ « Website » du dépôt Portfolio.
- [ ] **LinkedIn** : renseigner `https://www.willisback.fr` comme site web, et fournir l'URL du profil pour le `sameAs` de la tâche 3.
- [ ] **Liens entrants** : le lien « Conçu par William Derue » de syntheo.studio pointe vers `/en/About` (déjà prévu). Ajouter le même lien en pied de page de docs.syntheo.studio et dans le README des dépôts phares.

## Lot 1 — SEO technique (`feat/0.3.0`)

### Task 1: `robots.txt`

**Files:**
- Create: `app/robots.ts`
- Test: `app/robots.test.ts`

**Interfaces:**
- Consumes: `SITE_URL` de `lib/seo.ts`
- Produces: `default function robots(): MetadataRoute.Robots`

- [ ] **Step 1: Write the failing test** : `robots()` renvoie `rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }]`, `sitemap: "https://www.willisback.fr/sitemap.xml"` et `host: "https://www.willisback.fr"`.
- [ ] **Step 2: Run** `pnpm vitest run app/robots.test.ts`. Attendu : FAIL (module absent).
- [ ] **Step 3: Implement** `app/robots.ts`.
- [ ] **Step 4: Run** le test (PASS), puis `pnpm dev` et `curl -s localhost:3000/robots.txt`. Attendu : `User-Agent: *`, `Disallow: /admin`, `Sitemap: https://www.willisback.fr/sitemap.xml`.
- [ ] **Step 5: Commit** `feat(seo): robots.txt`.

### Task 2: `sitemap.xml` multilingue

**Files:**
- Create: `lib/sitemap.ts` (construction pure, testable)
- Create: `app/sitemap.ts` (branche `buildSitemap` sur les vrais dossiers)
- Test: `lib/sitemap.test.ts`

**Interfaces:**
- Consumes: `canonicalUrl`, `languageAlternates` de `lib/seo.ts` ; `listArticleSlugs(locale)`, `readArticle(slug, locale)` de `lib/articles/loader.ts` ; `routing.locales`.
- Produces: `buildSitemap(input: { articles: Record<Locale, { slug: string; date: string }[]> }): MetadataRoute.Sitemap`, et `default function sitemap(): MetadataRoute.Sitemap` qui l'appelle.

Règles : une entrée par couple (page, locale) existant. Chaque entrée porte `alternates.languages` limité aux locales où la page existe, plus `x-default` vers la version française. Les pages fixes (`""`, `/About`, `/Contact`, `/articles`) existent dans les trois locales. Pour un article, `lastModified` = la `date` du frontmatter. Pas de `priority` ni de `changeFrequency`, que Google ignore.

- [ ] **Step 1: Write the failing tests** :
  - `pages fixes` : 12 entrées (4 pages × 3 locales) ; contient `https://www.willisback.fr/About` et `https://www.willisback.fr/en/Contact` ; ne contient ni `/about` ni `/contact` en minuscules.
  - `article traduit` : avec `syntheo-beta-0-7` présent en fr, en et zh, trois entrées, dont la française a `alternates.languages` = `{ fr, en, zh, "x-default" }` et `lastModified` = `"2026-11-10"`.
  - `article non traduit` : présent en fr seulement, une seule entrée ; aucune URL `/zh/articles/...` ; `alternates.languages` = `{ fr, "x-default" }`.
  - `jamais l'admin` : aucune URL ne contient `/admin` ni `/api`.
- [ ] **Step 2: Run** `pnpm vitest run lib/sitemap.test.ts`. Attendu : FAIL.
- [ ] **Step 3: Implement** `buildSitemap` dans `lib/sitemap.ts`, puis `app/sitemap.ts`. Pour chaque locale, `listArticleSlugs(locale)` suivi de `readArticle` ; on écarte les réponses `fallback: true`.
- [ ] **Step 4: Run** les tests (PASS), puis `curl -s localhost:3000/sitemap.xml | grep -c "<url>"`. Attendu : 12 + le nombre d'articles par locale (21 aujourd'hui : 12 + 3 × 3).
- [ ] **Step 5: Commit** `feat(seo): sitemap multilingue`.

### Task 3: données structurées Person et WebSite

**Files:**
- Create: `lib/structured-data.ts`
- Create: `components/seo/JsonLd.tsx`
- Modify: `app/[locale]/page.tsx` (accueil), `app/[locale]/About/page.tsx`, `app/[locale]/articles/[slug]/page.tsx:107-116` (l'auteur renvoie à l'`@id` de la personne, et la balise passe par `JsonLd`)
- Create: `public/william-derue.png` (copie de `app/assets/coin_profile_pic.png`, servie à une URL stable)
- Test: `lib/structured-data.test.ts`, `components/seo/json-ld.test.tsx`

**Interfaces:**
- Consumes: `SITE_URL`, `canonicalUrl`, `inLanguage` de `lib/seo.ts`
- Produces:
  - `PERSON_ID = "https://www.willisback.fr/#person"`, `WEBSITE_ID = "https://www.willisback.fr/#website"`
  - `personJsonLd(locale: Locale, jobTitle: string): Record<string, unknown>`
  - `websiteJsonLd(locale: Locale): Record<string, unknown>`
  - `<JsonLd data={object | object[]} />`, qui rend `<script type="application/ld+json">` échappé

- [ ] **Step 1: Write the failing tests** :
  - `personJsonLd("fr", "Développeur IA")` contient `"@type": "Person"`, `"@id": PERSON_ID`, `name: "William Derue"`, `alternateName: ["WillisBack", "willisback"]`, `url: "https://www.willisback.fr"`, `image: "https://www.willisback.fr/william-derue.png"`, `sameAs: ["https://github.com/WillIsback"]`, `jobTitle: "Développeur IA"`.
  - `websiteJsonLd("en")` contient `"@type": "WebSite"`, `"@id": WEBSITE_ID`, `name: "WillisBack"`, `alternateName: ["William Derue", "Will Is Back"]`, `url: "https://www.willisback.fr/en"`, `inLanguage: "en-US"`, `publisher: { "@id": PERSON_ID }`.
  - `JsonLd` rendu avec `{ name: "</script><b>" }` : le HTML ne contient pas `</script><b>` et contient `</script>`.
- [ ] **Step 2: Run** `pnpm vitest run lib/structured-data.test.ts components/seo`. Attendu : FAIL.
- [ ] **Step 3: Implement** les deux fonctions et le composant. `jobTitle` vient des messages existants (`meta`, traduit) : pas de nouveau texte.
- [ ] **Step 4: Wire** l'accueil (`[websiteJsonLd, personJsonLd]`) et « À propos » (`personJsonLd`). Dans l'article, l'auteur devient `{ "@id": PERSON_ID, "@type": "Person", name: "William Derue", url: SITE_URL }`.
- [ ] **Step 5: Run** `pnpm vitest run` (tout vert), puis valider le HTML de `/` et de `/About` avec le [Rich Results Test](https://search.google.com/test/rich-results) ou `validator.schema.org` : 0 erreur.
- [ ] **Step 6: Commit** `feat(seo): données structurées Person et WebSite`.

### Task 4: images de partage

**Files:**
- Create: `app/[locale]/opengraph-image.tsx` (site)
- Create: `app/[locale]/articles/[slug]/opengraph-image.tsx` (titre de l'article)
- Create: `lib/og.ts` (textes et couleurs, purs)
- Test: `lib/og.test.ts`

**Interfaces:**
- Consumes: `readArticle(slug, locale)` ; messages `meta.title`, `meta.description`
- Produces: `ogText(input: { title: string; kicker: string }): { title: string; kicker: string }`, qui tronque le titre à 90 caractères avec « … ». Chaque fichier exporte `size = { width: 1200, height: 630 }`, `contentType = "image/png"` et `alt`.

Rendu : `ImageResponse` de `next/og`, fond `#fbfcff` (le `--background` clair), titre en indigo `#3b3a9e`, ligne « William Derue · WillisBack » en bas, et le `kicker` (« Article » ou « Portfolio ») en haut. La police par défaut de `next/og` suffit : pas de chargement de police.

- [ ] **Step 1: Write the failing test** : `ogText` laisse un titre de 40 caractères intact, réduit un titre de 120 caractères à 90 caractères se terminant par « … », et ne coupe jamais au milieu d'un mot.
- [ ] **Step 2: Run** `pnpm vitest run lib/og.test.ts`. Attendu : FAIL.
- [ ] **Step 3: Implement** `lib/og.ts`, puis les deux `opengraph-image.tsx`, avec `generateStaticParams` aligné sur celui de la page voisine.
- [ ] **Step 4: Verify** en dev : `curl -sI localhost:3000/opengraph-image`, `/en/opengraph-image` et `/articles/syntheo-beta-0-7/opengraph-image` répondent `200` et `content-type: image/png`. Le HTML de `/` contient `og:image` et `twitter:image`. Ouvrir une image pour contrôler le rendu.
- [ ] **Step 5: Commit** `feat(seo): images de partage du site et des articles`.

### Task 5: marque dans les métadonnées

**Files:**
- Modify: `messages/fr.json`, `messages/en.json`, `messages/zh.json` (clé `meta.title` de l'accueil, suppression de `meta.keywords`)
- Modify: `app/[locale]/layout.tsx` (retirer `keywords`), `lib/seo.ts` (`siteName`)
- Test: `lib/seo.test.ts`, `messages/message-parity.test.ts` (existant)

- [ ] **Step 1: Write the failing test** dans `lib/seo.test.ts` : `pageMetadata(...).openGraph.siteName === "WillisBack"`.
- [ ] **Step 2: Implement** : `siteName: "WillisBack"` dans `pageMetadata` et dans le layout. Le titre de l'accueil devient « William Derue · WillisBack | Développeur IA, parcours AI Engineer » (EN : « William Derue · WillisBack | AI Developer, AI Engineer track » ; ZH : « William Derue · WillisBack | AI 开发者 · AI Engineer 路线 »). Supprimer `keywords` du layout et des trois fichiers de messages.
- [ ] **Step 3: Run** `pnpm vitest run` : tout vert, parité des messages comprise.
- [ ] **Step 4: Commit** `feat(seo): marque WillisBack dans les métadonnées`.

### Clôture du lot 1

- [ ] PR `feat/0.3.0` vers `main`. Après le déploiement : `curl` sur `/robots.txt`, `/sitemap.xml` et `/opengraph-image` en production, puis soumission du sitemap dans Search Console et Bing (lot 0).

## Lot 2 — Pages projet indexables (spec à écrire)

C'est le seul moyen pour que les projets remontent sur leur nom : aujourd'hui, aucune URL du site ne leur est consacrée. Le lot touche le schéma Prisma, l'admin et les routes, donc il passe d'abord par `superpowers:brainstorming`, puis par une spec et un plan dédiés. Décisions à prendre dans la spec :

- URL : `/projets/<slug>` (FR) et `/en/projects/<slug>`, ou un seul segment `/projects/<slug>` pour toutes les locales, plus simple avec `localePrefix: "as-needed"`.
- `slug` : nouveau champ `Project.slug` unique (migration Prisma), proposé par l'admin à partir du titre.
- Périmètre : seulement les projets publics ayant un pitch, pour éviter les pages minces que Google déclasse.
- Contenu : pitch, description, stack, domaines, période, liens GitHub et site, articles liés (`projects: [id]` existe déjà dans le frontmatter), captures. Les fiches ne sont qu'en français : EN et ZH servent-ils un repli `noindex`, ou les fiches gagnent-elles des champs traduits ?
- Données structurées : `SoftwareSourceCode` (dépôt) ou `SoftwareApplication` (Syntheo), avec `author: { "@id": PERSON_ID }`.
- Le registre de l'accueil et la carte du carnet pointent vers la page projet au lieu de GitHub. Ajout au sitemap (`buildSitemap` reçoit une liste `projects`).

## Lot 3 — Mesure et contenu (continu)

- [ ] Deux semaines après le lot 1, relever dans Search Console les impressions, la position et le CTR pour « william derue », « willisback » et « syntheo ». Vérifier la couverture : nombre d'URL indexées sur le total du sitemap.
- [ ] Ouvrir une issue `fix` pour chaque page « Découverte, actuellement non indexée » ou « Explorée, actuellement non indexée ».
- [ ] Rythme d'articles : chaque nouvel article lie au moins un projet (`projects: [...]`) et un article précédent. Les liens internes portent l'autorité vers les pages projet du lot 2.
