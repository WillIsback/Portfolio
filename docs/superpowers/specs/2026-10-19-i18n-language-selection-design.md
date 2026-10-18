# Sélecteur de langue — français, anglais, chinois — design

Date : 2026-10-19 · Statut : validé par Will · Issue : [#24](https://github.com/WillIsback/Portfolio/issues/24) · Branche : `feat/i18n-language-selection`

## Intention

Ce que Will a demandé :

- Un sélecteur de langue sur le portfolio, avec le **français en langue par défaut**, plus **anglais** et **chinois**.
- « La meilleure lib Next.js du moment » pour le faire.

Décisions prises en brainstorming :

- **URL** : le français reste à la racine sans préfixe, l'anglais et le chinois sont préfixés. `localePrefix: 'as-needed'`.
- **Périmètre de ce lot** : interface publique + dictionnaires `lib/` + articles MDX.
- **Articles** : fichiers par locale, avec repli sur le français.
- **Recherche sémantique** : laissée telle quelle, non traduite.
- **Admin** : non traduit.

Critère de réussite : un visiteur allemand qui tombe sur une URL française voit « EN » dans l'en-tête, clique, et
lit l'intégralité du site en anglais, y compris les articles. Une URL française existante partagé sur LinkedIn ou
dans un mail continue de fonctionner, sans redirection.

Hors périmètre (YAGNI), à suivre dans des issues séparées :

- traduction de l'admin (~95 chaînes, mixte FR/EN, derrière authentification) ;
- traduction des champs `Project` en base (table de traduction ou colonnes par locale, + migration Prisma) ;
- modèles de recherche sémantique par locale (`content/map.json`, `content/search-items.json`,
  `public/models/carnet-static/`) et stopwords chinois ;
- traduction des données de `app/data/github-projects.json` (source du seed).

## 1. Bibliothèque

`next-intl` 4.14.x.

Deux raisons factuelles, pas une préférence de goût :

- `next-intl@4.14.9` déclare `next: '^12 || ^13 || ^14 || ^15 || ^16'` en peer dependency — la version stable couvre
  donc Next 16.3.8, le `next` du projet.
- sa documentation décrit explicitement `src/proxy.ts`, c'est-à-dire le nommage Next 16 de `middleware.ts`, que ce
  dépôt utilise déjà (`proxy.ts`).

Ce que la bibliothèque apporte et qu'on ne rebâtirait pas ici : syntaxe ICU (pluriels, sexes), clés de message
typées à la compilation, négociation `Accept-Language`, redirection de préfixe, et `hreflang` alternatif généré
automatiquement.

Alternatives écartées :

- **next-intl sans le routage App Router** (locale dans un cookie, préfixes posés à la main par des rewrites) :
  on perd `hreflang` et la négociation, et on se bat contre le framework ;
- **dictionnaires maison** (`dictionaries/fr.ts` + groupe `[locale]`) : zéro dépendance, mais il faut reconstruire
  la pluralisation ICU, le typage des clés et la négociation soi-même.

## 2. Routage

### `i18n/routing.ts`

```ts
export const routing = defineRouting({
  locales: ["fr", "en", "zh"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
});
```

`'as-needed'` garde le français sans préfixe et impose le préfixe aux deux autres. C'est ce qui garantit qu'aucune
URL française existante ne bouge.

### Arborescence

```
i18n/
  routing.ts        defineRouting
  request.ts        getRequestConfig → charge messages/<locale>.json
  navigation.ts     createNavigation(routing) → Link, useRouter, usePathname conscient de la locale
messages/
  fr.json  en.json  zh.json

app/
  [locale]/
    layout.tsx            ROOT LAYOUT — <html lang={locale}>, polices, generateMetadata
    page.tsx              ← app/page.tsx
    not-found.tsx
    articles/
      layout.tsx  page.tsx  [slug]/page.tsx
    About/
      layout.tsx  page.tsx
    Contact/
      layout.tsx  page.tsx
  (admin)/
    layout.tsx            ROOT LAYOUT — <html lang="fr">, html/body  ← NOUVEAU
    admin/…               inchangé
    login/                ← app/admin/login (déplacé)
  api/ actions/ workflows/ data/    inchangés, hors [locale]
```

### Deux root layouts

C'est la conséquence structurelle principale, et elle n'est pas optionnelle.

Dès lors que les routes publiques vivent sous `app/[locale]/`, `app/layout.tsx` ne peut plus être le root layout :
il n'y aurait plus de `<html lang>` au-dessus d'un segment dynamique. La solution idiomatique est **deux root
layouts dans deux groupes de routes**, chacun rendant son propre `<html>`/`<body>` :

- `app/[locale]/layout.tsx` porte `<html lang={locale}>`, les polices, le `ThemeProvider`, et le `metadata` global ;
- `app/(admin)/layout.tsx` porte `<html lang="fr">` + `<body>`, et devient l'enveloppe du back-office.

Ce second layout n'existe pas aujourd'hui et doit être créé. Le `(admin)` existant ne contient pas de `<html>` : il
hérite aujourd'hui de `app/layout.tsx`.

### Casse des routes

`/About` et `/Contact` sont en majuscules dans les URL (`components/Header/NavMenu.tsx:16,21` les code en dur).
Le déplacement sous `[locale]` **conserve la casse** : `/About` et `/en/About`. Lesminuscules casseraient les
liens existants et forceraient des redirections 301.

### Génération statique

`app/articles/[slug]/page.tsx` a `dynamicParams = false` et un `generateStaticParams` mono-dimensionnel. Il devient
le produit cartésien locales × slugs. `generateStaticParams` doit aussi rendre la locale racine
([`setRequestLocale`](https://next-intl.dev/docs/routing/setup) doit être appelé dans chaque layout et page pour
activer le rendu statique).

`lib/articles/loader.ts` prend déjà un paramètre `dir` sur `getArticleSlugs`, `getArticleBySlug`, `getAllArticles`
et `latestArticles` : la résolution par locale s'y greffe sans réécriture du chargeur.

## 3. Proxy

`proxy.ts` fait aujourd'hui uniquement du contrôle NextAuth sur `/admin/:path*`. Les deux gestionnaires se
composent plutôt que de se remplacer :

```ts
import createMiddleware from "next-intl/middleware";
import { auth } from "@/auth";
import { routing } from "@/i18n/routing";

const intlProxy = createMiddleware(routing);

export default auth((req) => intlProxy(req));

export const config = {
  matcher: ["/admin/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

`auth` est sans effet hors `/admin` ; `intlProxy` gère la négociation, les préfixes et les liens alternés partout
ailleurs. `auth.ts` n'est pas modifié.

## 4. Messages

### Inventaire et volumétrie

| Source | Volume | Destination |
|---|---|---|
| Littéraux JSX du site public | ~85 | `messages/*.json`, espace de noms par composant |
| Dictionnaires `lib/` | ~90 | idem, ou fonction si hors React (§5) |
| Métadonnées / SEO | 5 blocs | idem |
| Admin | ~95 | **hors périmètre** |

Les fichiers les plus denses sont `components/register/FilterBar.tsx` (~20), `app/Contact/page.tsx` (~15),
`app/page.tsx` (~7), `components/carnet/CarnetExplorer.tsx` (~6).

Toutes les chaînes passent par `t()`, y compris celles qui vivent hors JSX : `ERROR_MESSAGE` dans
`components/register/RegisterView.tsx:36-37`, `SCANS_LABEL`/`OTHER_LABEL` dans `mdx/TasksChart.tsx:8-9`, les
props `caption`/`ariaLabel` de `mdx/TasksChart.tsx`, `mdx/TokensChart.tsx`, `mdx/FaultBuckets.tsx`,
`mdx/Verdicts.tsx`, `mdx/Note.tsx`, `mdx/Sources.tsx`, le préfixe `Fig. {n} · ` de
`components/notebook/FigureCaption.tsx:10`, et le `"Aucun résultat."` de `components/ui/multi-select.tsx:41`.

### Casse de `lib/` : constantes → fonctions

`lib/status.ts`, `training.ts`, `practices.ts`, `domains.ts`, `register.ts`, `about.ts`, `instruments.ts` exportent
aujourd'hui des constantes (`STATUS_LABELS`, `TRAINING_LABELS`, `PRACTICE_LABELS`, `DOMAIN_LABELS`,
`CATEGORIES[].label`, `PARCOURS`, `INSTRUMENTS`) consommées **en dehors de React**, y compris dans des
composants serveur. Elles ne peuvent pas appeler un hook.

Elles deviennent des fonctions prenant le traducteur :

```ts
// avant
export const STATUS_LABELS = { InProgress: "en cours", Done: "terminé", Archived: "archivé" };
// après
export const statusLabels = (t: Translator) => ({
  InProgress: t("status.inProgress"),
  Done: t("status.done"),
  Archived: t("status.archived"),
});
```

`training.ts` est le cas le plus subtil : `trainingBadge`/`trainingBadgeShort` construisent des chaînes à partir
d'un gabarit (« Projet de formation · OpenClassrooms · … »). Elles deviennent des messages ICU avec des paramètres.

`content/map-clusters.ts` (5 libellés de clusters) bascule dans la même vague.

### Formatage regionalisé

Trois endroits codent `fr-FR` en dur et doivent suivre la locale active :

- `lib/articles/format.ts:1,15` — `formatDateFr`, `formatNumberFr` (renommés, ou paramétrés par locale) ;
- `lib/carnet/search.ts:85` — `SCORE_FORMAT` ;
- `components/carnet/MapItemList.tsx:14` — `localeCompare(…, "fr")`.

`lib/contact-form.ts:7-10` (`errorSummary()` : « 1 champ à corriger » / « N champs à corriger ») est un candidat
naturel à un message ICU avec pluriel.

## 5. Articles

### Disposition

```
content/articles/
  neuf-agents-neuf-jours.mdx          français (référence)
  predire-sans-entrainer.mdx          français (référence)
  en/*.mdx                            optionnel
  zh/*.mdx                            optionnel
```

Le nom de fichier reste le slug : une traduction garde le slug de l'original, pour que les liens entre articles et
les références de projet (`projects: [27]`) restent valides.

### Résolution avec repli

Le loader cherche `content/articles/<locale>/<slug>.mdx`, puis `content/articles/<slug>.mdx`. Si aucune
traduction n'existe, l'article est rendu en français **avec un avis visible** indiquant qu'il n'est pas encore
traduit dans la langue demandée. Pas de 404, et surtout pas d'indicateur trompeur : le lecteur sait qu'il ne lit
pas la langue qu'il a choisie.

Le repli doit être signalé dans le listing également, pas seulement sur la page de l'article — sinon le lecteur
clique et découvre la chute en cours de lecture.

## 6. Typographie chinoise

Les cinq déclarations de Google Fonts de `app/layout.tsx` (quatre familles : Bricolage Grotesque, Source Serif 4
— dont une italique —, Caveat, Fira Code) sont toutes en `subsets: ["latin"]`. Les glyphes chinois n'ont donc
aucune police dédiée : ils retombent sur la police du système, ce qui jure franchement avec l'identité « carnet de
labo » (Bricolage Grotesque + Source Serif 4 + Caveat).

Il faut une pile CJK pour `zh`. `Noto Sans SC` via `next/font/google`, appliquée quand `locale === "zh"`, avec
repli sur la pile système CJK. Les polices de labo restent en place pour ce qui est latin (noms propres,
identifiants techniques, nombres).

## 7. Tests

État de départ : **77 fichiers, 506 tests**. Trois casseurs, tous connus à l'avance.

1. **~19 assertions** codent en dur des chaînes françaises, sur les composants du site public :
   `components/register/register.test.tsx` (lignes 133-134, 153, 257, 288-289, 396, 398, 408),
   `components/register/register-view.test.tsx` (70, 76, 115), `components/carnet/explorer.test.tsx` (34, 43-44),
   `components/carnet/map.test.tsx` (98), `components/home/home-sections.test.tsx` (53),
   `components/notebook/notebook.test.tsx` (86), `components/articles/mdx/figures.test.tsx` (103, 117, 135).
2. **~10 assertions** visent les dictionnaires `lib/` : `lib/status.test.ts:9-14`, `lib/training.test.ts:10-13`,
   `lib/about.test.ts:10-23`, `lib/carnet/map-build.test.ts:104`.
3. **5 tests lisent les `.tsx` comme du texte source** pour vérifier des chemins : `app/home.test.ts`,
   `app/contact.test.ts`, `app/toaster.test.ts`, `app/articles/articles-pages.test.ts`, `next.config.test.ts`.

Les assertions portant sur l'admin (`components/agents/agents.ssr.test.tsx`, `app/actions/agents.action.test.ts`,
`app/(admin)/admin/practice-fields.ssr.test.tsx`, `project-form.ssr.test.tsx`, `sync-board.ssr.test.tsx`,
`lib/agents/github-pr.test.ts`) ne sont pas concernées : l'admin reste en français et hors périmètre. Elles
doivent continuer de passer telles quelles, et c'est un garde-fou utile — si l'une d'elles casse, c'est que le
restructure a débordé sur l'admin.

### Stratégie

- Nouveau helper `tests/i18n-render.tsx` : `renderToStaticMarkup` enveloppé dans un `NextIntlClientProvider`
  alimenté par `messages/fr.json`. Sans lui, tout test de rendu d'un composant traduit échoue.
- Les assertions littérales pointent désormais sur la **valeur réelle de `messages/fr.json`** plutôt que sur une
  chaîne magic du fichier de test. Elles valident alors le dictionnaire en plus du rendu.
- Les 5 tests de lecture de source sont repointés sur les nouveaux chemins (`app/[locale]/page.tsx`, …).
- Ajout de tests propres à l'i18n : résolution de locale (`hasLocale`), repli d'article, résolution du préfixe par
  le proxy, et parité des clés entre `fr.json`, `en.json` et `zh.json` — ce dernier est le seul garde-fou qui
  empêche ledictionnaire de dériver.

`pnpm lint`, `pnpm test` et `pnpm build` doivent passer ; le build est le vrai test de bout en bout, parce que
`generateStaticParams` croisé et les deux root layouts ne sont vérifiés qu'à la compilation.

## 8. Métadonnées et SEO

Cinq blocs de metadata existent, tous en dur (`app/layout.tsx:48-92`, `app/About/layout.tsx`,
`app/Contact/layout.tsx`, `app/articles/page.tsx`, `app/articles/[slug]/page.tsx:34-63`), plus le
`inLanguage: "fr-FR"` du JSON-LD `BlogPosting` (ligne 93) et le `<html lang="fr">`.

À paramétrer par locale : `openGraph.locale` (`fr_FR` / `en_US` / `zh_CN`), `inLanguage`, `<html lang>`, et les
URL canoniques codées en dur (`https://www.willisback.fr/...`, 4 occurrences). Les liens alternés
(`alternates.languages`) sont fournis par le proxy next-intl, mais le `canonical` explicite reste à écrire.

Aucun `app/sitemap.ts` ni `app/robots.ts` n'existe aujourd'hui. Les ajouter n'est pas nécessaire à ce lot ; c'est un
suivi naturel, mais hors périmètre ici.

## 9. Déroulement

1. Dépendance + squelette `i18n/`, `messages/fr.json` (français = référence, copié depuis l'existant).
2. `proxy.ts` composé, segments `[locale]`, deux root layouts, déplacement des routes publiques.
3. Les tests cassent : c'est attendu et c'est le jalon. Les Repair vers la nouvelle arborescence.
4. Extraction des dictionnaires `lib/` (constantes → fonctions).
5. Extraction des littéraux JSX, par Biggest-first : `FilterBar`, `Contact`, `page.tsx`, `CarnetExplorer`, Header/Footer.
6. Articles : loader par locale + repli + `generateStaticParams` croisé, puis rédaction de `en/` et `zh/`.
7. Typographie CJK.
8. Métadonnées, `alternates`, JSON-LD.
9. Switcher, puis passe complète `lint` + `test` + `build`.

Les étapes 2 et 3 sont le point de bascule : le dépôt ne compile pas entre elles. Elles sont faites d'un bloc.

## 10. Risques

| Risque | Traitement |
|---|---|
| Deux root layouts mal closures → erreur Next sur `<html>` dupliqué | `(admin)/layout.tsx` ne rend que `html`/`body`, jamais de `<nav` ni de second `<html>` |
| Le reorder des routes casse les tests de lecture de source | Inventorié au §7, repointé à l'étape 3 |
| Les fichiers MDX traduits ne sont pas relus | Avis de repli visible ; l'EN/ZH sont rédigés comme du contenu, pas de la traduction automatique |
| `next/font` CJK pèse plusieurs Mo | `display: "swap"`, `preload: false`, chargé seulement quand `locale === "zh"` |
| Dérive des clés de message | Test de parité `fr`/`en`/`zh` (§7) |
| Le préfixe `/en/About` casse un lien externe | Le français n'a pas bougé ; les URL EN/ZH sont neuves |