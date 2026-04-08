# Design : Banque d'icônes & Tags ML/IAG — Admin Projects

**Date :** 2026-04-08
**Scope :** Formulaire admin d'ajout/édition de projet (`ProjectEditForm`), `ProjectCard`, schémas Zod, modèle Prisma.

---

## 1. Objectif

Deux améliorations au formulaire admin de gestion des projets :

1. **Banque d'icônes** — remplacer le champ texte libre `imagePath` par un picker visuel (modale) qui liste les SVG existants dans `/public/logo/` et `/public/icon/`, plus 5 icônes génériques depuis `lucide-react`.
2. **Tags ML / IAG** — ajouter deux champs booléens `isML` et `isIAG` au modèle `Project`, affichés comme badges sur `ProjectCard` et éditables via des checkboxes dans `ProjectEditForm`.

---

## 2. Changements base de données

### Prisma (`prisma/schema.prisma`)

Deux nouvelles colonnes sur le modèle `Project` :

```prisma
isML  Boolean @default(false)
isIAG Boolean @default(false)
```

Migration : `prisma migrate dev --name add_isML_isIAG`

---

## 3. Schémas Zod (`schemas/index.ts`)

`AdminProjectSchema` reçoit deux nouveaux champs identiques à `isAiGenerated` :

```ts
isML:  z.boolean().default(false),
isIAG: z.boolean().default(false),
```

`AdminProject` (type inféré) se met à jour automatiquement.

---

## 4. Actions admin (`app/actions/admin.action.ts`)

Les actions `updateProject` et `createProject` transmettent `isML` et `isIAG` à Prisma en écriture et les incluent dans les données lues en retour. Aucun changement de signature.

---

## 5. Banque d'icônes

### `lib/icon-bank.ts`

Exporte deux constantes :

**`FILE_ICONS`** — tableau d'objets `{ label, path, category }` listant statiquement :
- Catégorie `"logo"` : tous les SVG de `/public/logo/` (ex: `/logo/ML.svg`, `/logo/Portfolio.svg`, `/logo/Data.svg`, etc.)
- Catégorie `"icon"` : tous les SVG de `/public/icon/` (ex: `/icon/Github.svg`, `/icon/Python.svg`, `/icon/Docker.svg`, etc.)

**`LUCIDE_ICONS`** — tableau d'objets `{ label, id, component }` pour 5 icônes lucide-react :

| id | Composant | Label |
|----|-----------|-------|
| `lucide:Bot` | `Bot` | Assistant IA |
| `lucide:Map` | `Map` | Géographie |
| `lucide:Camera` | `Camera` | Photo / Média |
| `lucide:Leaf` | `Leaf` | Nature / Agriculture |
| `lucide:Users` | `Users` | Communauté |

Le format `"lucide:<NomComposant>"` est la convention pour distinguer les icônes vectorielles inline des chemins fichiers dans `imagePath`.

---

## 6. Composant `IconPickerModal`

**Fichier :** `components/admin/IconPickerModal.tsx`
**Type :** `"use client"`

### Props
```ts
interface IconPickerModalProps {
  open: boolean;
  current: string | undefined;
  onSelect: (value: string) => void;
  onClose: () => void;
}
```

### Comportement
- Modale avec trois sections séparées par un titre : **Logos projet**, **Icônes tech**, **Génériques**
- Grille de thumbnails cliquables :
  - Sections `logo` et `icon` : `<Image>` Next.js, taille 40×40
  - Section génériques : composant lucide rendu inline, taille 40×40
- L'icône correspondant à `current` est surlignée (bordure ou fond distinctif)
- Au clic sur une icône : appel `onSelect(value)` + fermeture automatique (`onClose()`)
- Fermeture aussi via overlay ou bouton "Fermer"

---

## 7. Modifications `ProjectEditForm`

**Fichier :** `app/(admin)/admin/projects/[id]/ProjectEditForm.tsx`

### Remplacement du champ `imagePath`
Le champ texte `imagePath` est remplacé par :
- Un aperçu de l'icône courante (miniature 40×40, même logique que `ProjectCard`)
- Un bouton "Choisir une icône" qui bascule `modalOpen` à `true`
- `IconPickerModal` monté conditionnellement, branché sur `form.imagePath`

La valeur reste stockée dans `form.imagePath` (type `string`), aucun changement de type.

### Nouveaux checkboxes
Dans la section checkboxes existante, deux ajouts après `isAiGenerated` :

```
[ ] Private   [ ] AI Generated   [ ] Machine Learning   [ ] IAG
```

Les champs `isML` et `isIAG` sont gérés via `setField`, identique aux autres booléens.

---

## 8. Modifications `ProjectCard`

**Fichier :** `components/ProjectGrid/ProjectCard/ProjectCard.tsx`

### Rendu de `image_path` / `imagePath`
Logique de rendu mise à jour :

```
if image_path starts with "lucide:" →
  extraire le nom (ex: "Bot")
  rendre le composant lucide depuis une map statique { Bot, Map, Camera, Leaf, Users }
else →
  comportement actuel : <Image> avec fallback "/icon/Github.svg"
```

### Nouveaux badges
Dans le header de la card, après le badge "AI" existant :
- `isML` → `<Badge>` bleu avec label "ML"
- `isIAG` → `<Badge>` violet avec label "IAG" (style similaire au badge "AI")

Les props `isML` et `isIAG` sont ajoutées au type `ProjectProps`.

---

## 9. Fichiers impactés

| Fichier | Type de changement |
|---|---|
| `prisma/schema.prisma` | Ajout `isML`, `isIAG` sur `Project` |
| `schemas/index.ts` | Ajout `isML`, `isIAG` dans `AdminProjectSchema` |
| `app/actions/admin.action.ts` | Transmission des nouveaux champs |
| `lib/icon-bank.ts` | Nouveau fichier |
| `components/admin/IconPickerModal.tsx` | Nouveau fichier |
| `app/(admin)/admin/projects/[id]/ProjectEditForm.tsx` | Picker + checkboxes |
| `components/ProjectGrid/ProjectCard/ProjectCard.tsx` | Badges + rendu lucide |

---

## 10. Hors scope

- Upload de nouveaux fichiers SVG depuis l'interface admin
- Recherche/filtre dans la modale de sélection d'icônes
- Filtrage des projets par tag ML/IAG sur la page publique
