# Icon Bank & Tags ML/IAG — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un picker visuel d'icônes (modale) et deux tags booléens ML/IAG dans le formulaire admin de gestion des projets, avec affichage en badges sur les ProjectCards.

**Architecture:** Migration Prisma pour `isML`/`isIAG` → mise à jour des types/schémas → nouvelles actions admin → composants admin (icon-bank + modal) → formulaire admin → ProjectCard.

**Tech Stack:** Prisma (PostgreSQL), Zod, Next.js 16, React 19, Tailwind CSS, lucide-react, shadcn Dialog.

---

## Fichiers impactés

| Fichier | Action |
|---|---|
| `prisma/schema.prisma` | Modifier — ajouter `isML`, `isIAG` sur `Project` |
| `schemas/index.ts` | Modifier — ajouter `isML`, `isIAG` dans `AdminProjectSchema` |
| `lib/projects-data.ts` | Modifier — ajouter `isML`, `isIAG` dans `NormalizedProject` et `normalizeProject` |
| `app/actions/projects.action.ts` | Modifier — ajouter `isML`, `isIAG` dans les `select` Prisma |
| `app/actions/admin.action.ts` | Modifier — passer `isML`, `isIAG` dans `createProject` et `updateProject` |
| `app/(admin)/admin/projects/[id]/page.tsx` | Modifier — inclure `isML`, `isIAG` dans `initial` |
| `lib/icon-bank.ts` | Créer — liste statique des icônes fichiers et lucide |
| `components/admin/IconPickerModal.tsx` | Créer — modale de sélection d'icône |
| `app/(admin)/admin/projects/[id]/ProjectEditForm.tsx` | Modifier — remplacer champ texte + ajouter checkboxes |
| `components/ProjectGrid/ProjectCard/ProjectCard.tsx` | Modifier — badges ML/IAG + rendu lucide |
| `components/ProjectGrid/ProjectList.tsx` | Modifier — passer `isML`, `isIAG` à `ProjectCard` |

---

## Task 1 : Migration Prisma — ajouter isML et isIAG

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1 : Ajouter les champs dans le schéma Prisma**

Dans `prisma/schema.prisma`, localiser le modèle `Project` et ajouter les deux lignes après `isAiGenerated` :

```prisma
model Project {
  id            Int      @id @default(autoincrement())
  title         String
  description   String
  imagePath     String?
  github        String?
  lastUpdate    DateTime?
  isPrivate     Boolean  @default(false)
  isAiGenerated Boolean  @default(false)
  isML          Boolean  @default(false)
  isIAG         Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  languages   ProjectLanguage[]
  databases   ProjectDatabase[]
  backends    ProjectBackend[]
  frontends   ProjectFrontend[]
  devops      ProjectDevOps[]
}
```

- [ ] **Step 2 : Lancer la migration**

```bash
pnpm prisma migrate dev --name add_isML_isIAG
```

Résultat attendu : `Your database is now in sync with your schema.` et création d'un fichier dans `prisma/migrations/`.

- [ ] **Step 3 : Vérifier la génération du client Prisma**

```bash
pnpm prisma generate
```

Résultat attendu : `Generated Prisma Client` sans erreur.

- [ ] **Step 4 : Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add isML and isIAG fields to Project model"
```

---

## Task 2 : Mise à jour des types — schemas, NormalizedProject, projects.action

**Files:**
- Modify: `schemas/index.ts`
- Modify: `lib/projects-data.ts`
- Modify: `app/actions/projects.action.ts`

- [ ] **Step 1 : Ajouter isML et isIAG dans AdminProjectSchema**

Dans `schemas/index.ts`, modifier `AdminProjectSchema` :

```typescript
export const AdminProjectSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().min(1, "La description est requise"),
  imagePath: z.string().optional(),
  github: z.string().optional(),
  lastUpdate: z.string().optional(),
  isPrivate: z.boolean().default(false),
  isAiGenerated: z.boolean().default(false),
  isML: z.boolean().default(false),
  isIAG: z.boolean().default(false),
  languages: z.array(LanguageEnum).default([]),
  databases: z.array(DatabaseEnum).default([]),
  backends: z.array(BackendApiEnum).default([]),
  frontends: z.array(FrontendEnum).default([]),
  devops: z.array(DevOpsEnum).default([]),
});
```

- [ ] **Step 2 : Ajouter isML et isIAG dans NormalizedProject**

Dans `lib/projects-data.ts`, modifier l'interface `NormalizedProject` :

```typescript
export interface NormalizedProject {
  id: number;
  title: string;
  description: string;
  imagePath: string | null;
  github: string | null;
  lastUpdate: Date | null;
  isPrivate: boolean;
  isAiGenerated: boolean;
  isML: boolean;
  isIAG: boolean;
  createdAt: Date;
  updatedAt: Date;
  languages: { language: string }[];
  databases: { database: string }[];
  backends: { backend: string }[];
  frontends: { frontend: string }[];
  devops: { devops: string }[];
}
```

- [ ] **Step 3 : Ajouter isML et isIAG dans normalizeProject**

Dans `lib/projects-data.ts`, modifier la fonction `normalizeProject` pour inclure les deux nouveaux champs (ils ne sont pas dans le JSON existant, donc on les default à `false`) :

```typescript
function normalizeProject(
  project: JsonProject,
  index: number,
): NormalizedProject {
  const lastUpdate = new Date(project.lastUpdate);
  return {
    id: index + 1,
    title: project.title,
    description: project.description,
    imagePath: project.imagePath || null,
    github: project.github,
    lastUpdate,
    isPrivate: project.isPrivate,
    isAiGenerated: project.isAiGenerated,
    isML: false,
    isIAG: false,
    createdAt: lastUpdate,
    updatedAt: lastUpdate,
    languages: project.languages.map((lang) => ({ language: lang })),
    databases: (project.techStack?.database || []).map((db) => ({
      database: db,
    })),
    backends: (project.techStack?.backendApi || []).map((api) => ({
      backend: api,
    })),
    frontends: (project.techStack?.frontend || []).map((fe) => ({
      frontend: fe,
    })),
    devops: (project.techStack?.devOps || []).map((dop) => ({ devops: dop })),
  };
}
```

- [ ] **Step 4 : Ajouter isML et isIAG dans les select Prisma de projects.action.ts**

Dans `app/actions/projects.action.ts`, deux endroits utilisent un `select` — dans `getProjectsFromDb` (ligne ~101) et `getProjectById` (ligne ~183). Ajouter `isML: true, isIAG: true` dans chacun :

```typescript
// Dans getProjectsFromDb (prisma.project.findMany)
select: {
  id: true,
  title: true,
  description: true,
  imagePath: true,
  github: true,
  lastUpdate: true,
  isPrivate: true,
  isAiGenerated: true,
  isML: true,
  isIAG: true,
  createdAt: true,
  updatedAt: true,
  languages: true,
  databases: true,
  backends: true,
  frontends: true,
  devops: true,
},
```

Même modification pour le `select` dans `getProjectById`.

- [ ] **Step 5 : Vérifier les types**

```bash
pnpm tsc --noEmit
```

Résultat attendu : aucune erreur TypeScript.

- [ ] **Step 6 : Commit**

```bash
git add schemas/index.ts lib/projects-data.ts app/actions/projects.action.ts
git commit -m "feat: propagate isML and isIAG through type system"
```

---

## Task 3 : Admin plumbing — action + page edit

**Files:**
- Modify: `app/actions/admin.action.ts`
- Modify: `app/(admin)/admin/projects/[id]/page.tsx`

- [ ] **Step 1 : Ajouter isML et isIAG dans createProject**

Dans `app/actions/admin.action.ts`, modifier le bloc `tx.project.create` dans `createProject` :

```typescript
const project = await tx.project.create({
  data: {
    title: data.title,
    description: data.description,
    imagePath: data.imagePath ?? null,
    github: data.github ?? "",
    lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : null,
    isPrivate: data.isPrivate,
    isAiGenerated: data.isAiGenerated,
    isML: data.isML,
    isIAG: data.isIAG,
  },
});
```

- [ ] **Step 2 : Ajouter isML et isIAG dans updateProject**

Dans `app/actions/admin.action.ts`, modifier le bloc `tx.project.update` dans `updateProject` :

```typescript
await tx.project.update({
  where: { id },
  data: {
    title: data.title,
    description: data.description,
    imagePath: data.imagePath ?? null,
    github: data.github ?? "",
    lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : null,
    isPrivate: data.isPrivate,
    isAiGenerated: data.isAiGenerated,
    isML: data.isML,
    isIAG: data.isIAG,
  },
});
```

- [ ] **Step 3 : Ajouter isML et isIAG dans l'objet initial de page.tsx**

Dans `app/(admin)/admin/projects/[id]/page.tsx`, modifier l'objet `initial` :

```typescript
const initial: AdminProject = {
  title: project.title,
  description: project.description,
  imagePath: project.imagePath ?? "",
  github: project.github ?? "",
  lastUpdate: project.lastUpdate?.toISOString() ?? "",
  isPrivate: project.isPrivate,
  isAiGenerated: project.isAiGenerated,
  isML: project.isML,
  isIAG: project.isIAG,
  languages: project.languages.map((l) => l.language),
  databases: project.databases.map((d) => d.database),
  backends: project.backends.map((b) => b.backend),
  frontends: project.frontends.map((f) => f.frontend),
  devops: project.devops.map((d) => d.devops),
};
```

- [ ] **Step 4 : Vérifier les types**

```bash
pnpm tsc --noEmit
```

Résultat attendu : aucune erreur TypeScript.

- [ ] **Step 5 : Commit**

```bash
git add app/actions/admin.action.ts app/(admin)/admin/projects/[id]/page.tsx
git commit -m "feat: pass isML and isIAG in admin create/update actions"
```

---

## Task 4 : Banque d'icônes — lib/icon-bank.ts

**Files:**
- Create: `lib/icon-bank.ts`

- [ ] **Step 1 : Créer lib/icon-bank.ts**

```typescript
import { Bot, Camera, Leaf, Map, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FileIcon = {
  label: string;
  path: string;
  category: "logo" | "icon";
};

export type LucideIconEntry = {
  id: string;
  label: string;
  component: LucideIcon;
};

export const FILE_ICONS: FileIcon[] = [
  { label: "Abricot", path: "/logo/Abricot.svg", category: "logo" },
  { label: "AI Report Maker", path: "/logo/AiReportMaker.svg", category: "logo" },
  { label: "Booki", path: "/logo/Booki.svg", category: "logo" },
  { label: "Data", path: "/logo/Data.svg", category: "logo" },
  { label: "FishEye", path: "/logo/FishEye.svg", category: "logo" },
  { label: "Les Petits Plats", path: "/logo/LesPetitsPlats.svg", category: "logo" },
  { label: "ML", path: "/logo/ML.svg", category: "logo" },
  { label: "OhMyFood", path: "/logo/OhMyFood.svg", category: "logo" },
  { label: "Portfolio", path: "/logo/Portfolio.svg", category: "logo" },
  { label: "Riding Cities", path: "/logo/RidingCities.svg", category: "logo" },
  { label: "Sophie Bluel", path: "/logo/SophieBluel.svg", category: "logo" },
  { label: "Sportsee", path: "/logo/Sportsee.svg", category: "logo" },
  { label: "Docker", path: "/icon/Docker.svg", category: "icon" },
  { label: "Express.js", path: "/icon/Expressjs.svg", category: "icon" },
  { label: "FastAPI", path: "/icon/FastApi.svg", category: "icon" },
  { label: "Fastify", path: "/icon/Fastify.svg", category: "icon" },
  { label: "GitHub", path: "/icon/Github.svg", category: "icon" },
  { label: "Informix", path: "/icon/Informix.svg", category: "icon" },
  { label: "MongoDB", path: "/icon/Mongodb.svg", category: "icon" },
  { label: "Next.js", path: "/icon/Nextjs.svg", category: "icon" },
  { label: "PostgreSQL", path: "/icon/Postgresql.svg", category: "icon" },
  { label: "Python", path: "/icon/Python.svg", category: "icon" },
  { label: "React", path: "/icon/React.svg", category: "icon" },
  { label: "Svelte", path: "/icon/Svelte.svg", category: "icon" },
  { label: "Tanstack", path: "/icon/Tanstack.svg", category: "icon" },
  { label: "TypeScript", path: "/icon/Typescript.svg", category: "icon" },
  { label: "Vite", path: "/icon/Vite.svg", category: "icon" },
];

export const LUCIDE_ICONS: LucideIconEntry[] = [
  { id: "lucide:Bot", label: "Assistant IA", component: Bot },
  { id: "lucide:Map", label: "Géographie", component: Map },
  { id: "lucide:Camera", label: "Photo / Média", component: Camera },
  { id: "lucide:Leaf", label: "Nature / Agriculture", component: Leaf },
  { id: "lucide:Users", label: "Communauté", component: Users },
];
```

- [ ] **Step 2 : Vérifier les types**

```bash
pnpm tsc --noEmit
```

Résultat attendu : aucune erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add lib/icon-bank.ts
git commit -m "feat: add static icon bank with logo, tech, and lucide icons"
```

---

## Task 5 : Composant IconPickerModal

**Files:**
- Create: `components/admin/IconPickerModal.tsx`

- [ ] **Step 1 : Créer components/admin/IconPickerModal.tsx**

```typescript
"use client";

import Image from "next/image";
import type React from "react";
import { FILE_ICONS, LUCIDE_ICONS } from "@/lib/icon-bank";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface IconPickerModalProps {
  open: boolean;
  current: string | undefined;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function IconPickerModal({
  open,
  current,
  onSelect,
  onClose,
}: IconPickerModalProps) {
  const logos = FILE_ICONS.filter((i) => i.category === "logo");
  const icons = FILE_ICONS.filter((i) => i.category === "icon");

  function handleSelect(value: string) {
    onSelect(value);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Choisir une icône</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Section title="Logos projet">
            <IconGrid>
              {logos.map((icon) => (
                <IconTile
                  key={icon.path}
                  label={icon.label}
                  isSelected={current === icon.path}
                  onClick={() => handleSelect(icon.path)}
                >
                  <Image
                    src={icon.path}
                    alt={icon.label}
                    width={40}
                    height={40}
                    className="object-contain w-10 h-10"
                  />
                </IconTile>
              ))}
            </IconGrid>
          </Section>

          <Section title="Icônes tech">
            <IconGrid>
              {icons.map((icon) => (
                <IconTile
                  key={icon.path}
                  label={icon.label}
                  isSelected={current === icon.path}
                  onClick={() => handleSelect(icon.path)}
                >
                  <Image
                    src={icon.path}
                    alt={icon.label}
                    width={40}
                    height={40}
                    className="object-contain w-10 h-10"
                  />
                </IconTile>
              ))}
            </IconGrid>
          </Section>

          <Section title="Génériques">
            <IconGrid>
              {LUCIDE_ICONS.map((icon) => {
                const IconComponent = icon.component;
                return (
                  <IconTile
                    key={icon.id}
                    label={icon.label}
                    isSelected={current === icon.id}
                    onClick={() => handleSelect(icon.id)}
                  >
                    <IconComponent className="w-10 h-10 text-zinc-300" />
                  </IconTile>
                );
              })}
            </IconGrid>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
        {title}
      </p>
      {children}
    </div>
  );
}

function IconGrid({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function IconTile({
  label,
  isSelected,
  onClick,
  children,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 rounded-lg border cursor-pointer transition-colors w-16 ${
        isSelected
          ? "border-zinc-400 bg-zinc-800"
          : "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900"
      }`}
    >
      {children}
      <span className="text-[10px] text-zinc-500 truncate w-full text-center">
        {label}
      </span>
    </button>
  );
}
```

- [ ] **Step 2 : Vérifier les types**

```bash
pnpm tsc --noEmit
```

Résultat attendu : aucune erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add components/admin/IconPickerModal.tsx
git commit -m "feat: add IconPickerModal with logo, tech, and generic icon sections"
```

---

## Task 6 : Mise à jour de ProjectEditForm

**Files:**
- Modify: `app/(admin)/admin/projects/[id]/ProjectEditForm.tsx`

- [ ] **Step 1 : Remplacer le contenu de ProjectEditForm.tsx**

Remplacer le fichier entier par :

```typescript
// app/(admin)/projects/[id]/ProjectEditForm.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProject } from "@/app/actions/admin.action";
import { IconPickerModal } from "@/components/admin/IconPickerModal";
import {
  type AdminProject,
  BackendApiEnum,
  DatabaseEnum,
  DevOpsEnum,
  FrontendEnum,
  LanguageEnum,
} from "@/schemas";
import { Bot, Camera, Leaf, Map, Users } from "lucide-react";

const LUCIDE_COMPONENT_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "lucide:Bot": Bot,
  "lucide:Map": Map,
  "lucide:Camera": Camera,
  "lucide:Leaf": Leaf,
  "lucide:Users": Users,
};

export function ProjectEditForm({
  id,
  initial,
}: {
  id: number;
  initial: AdminProject;
}) {
  const router = useRouter();
  const [form, setForm] = useState<AdminProject>(initial);
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);

  function setField<K extends keyof AdminProject>(
    key: K,
    value: AdminProject[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArrayValue<T extends string>(
    key: keyof AdminProject,
    value: T,
  ) {
    const current = (form[key] as T[]) ?? [];
    setField(
      key,
      (current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]) as AdminProject[typeof key],
    );
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateProject(id, form);
        toast.success("Project updated");
        router.push("/admin/projects");
      } catch {
        toast.error("Update failed");
      }
    });
  }

  function renderCurrentIcon() {
    const path = form.imagePath;
    if (!path) {
      return (
        <div className="w-10 h-10 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-600 text-xs">
          ?
        </div>
      );
    }
    if (path.startsWith("lucide:")) {
      const LucideComponent = LUCIDE_COMPONENT_MAP[path];
      if (LucideComponent) {
        return <LucideComponent className="w-10 h-10 text-zinc-300" />;
      }
    }
    const src = path.startsWith("/") ? path : `/${path}`;
    return (
      <Image
        src={src}
        alt="Icône du projet"
        width={40}
        height={40}
        className="object-contain w-10 h-10"
      />
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="title" className="text-xs text-zinc-500 block mb-1">
            Title
          </label>
          <input
            id="title"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
          />
        </div>
        <div>
          <p className="text-xs text-zinc-500 block mb-1">Icône</p>
          <div className="flex items-center gap-3">
            {renderCurrentIcon()}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
            >
              Choisir une icône
            </button>
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="text-xs text-zinc-500 block mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 min-h-[100px]"
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="github" className="text-xs text-zinc-500 block mb-1">
          GitHub URL
        </label>
        <input
          id="github"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
          value={form.github ?? ""}
          onChange={(e) => setField("github", e.target.value)}
        />
      </div>

      <TechStackCheckboxes
        label="Languages"
        options={LanguageEnum.options}
        selected={form.languages}
        onChange={(v) => toggleArrayValue("languages", v)}
      />
      <TechStackCheckboxes
        label="Databases"
        options={DatabaseEnum.options}
        selected={form.databases}
        onChange={(v) => toggleArrayValue("databases", v)}
      />
      <TechStackCheckboxes
        label="Backend APIs"
        options={BackendApiEnum.options}
        selected={form.backends}
        onChange={(v) => toggleArrayValue("backends", v)}
      />
      <TechStackCheckboxes
        label="Frontend"
        options={FrontendEnum.options}
        selected={form.frontends}
        onChange={(v) => toggleArrayValue("frontends", v)}
      />
      <TechStackCheckboxes
        label="DevOps"
        options={DevOpsEnum.options}
        selected={form.devops}
        onChange={(v) => toggleArrayValue("devops", v)}
      />

      <div className="flex gap-4 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPrivate}
            onChange={(e) => setField("isPrivate", e.target.checked)}
            className="accent-zinc-400"
          />
          Private
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isAiGenerated}
            onChange={(e) => setField("isAiGenerated", e.target.checked)}
            className="accent-zinc-400"
          />
          AI Generated
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isML}
            onChange={(e) => setField("isML", e.target.checked)}
            className="accent-blue-400"
          />
          Machine Learning
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isIAG}
            onChange={(e) => setField("isIAG", e.target.checked)}
            className="accent-violet-400"
          />
          IAG
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="bg-zinc-100 text-zinc-900 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-white transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/projects")}
          className="border border-zinc-700 text-zinc-400 px-5 py-2.5 rounded-lg text-sm hover:border-zinc-500 transition-colors"
        >
          Cancel
        </button>
      </div>

      <IconPickerModal
        open={modalOpen}
        current={form.imagePath}
        onSelect={(value) => setField("imagePath", value)}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

function TechStackCheckboxes({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label
            key={opt}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
              selected.includes(opt)
                ? "border-zinc-400 text-zinc-200 bg-zinc-800"
                : "border-zinc-700 text-zinc-500"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={selected.includes(opt)}
              onChange={() => onChange(opt)}
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier les types**

```bash
pnpm tsc --noEmit
```

Résultat attendu : aucune erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add app/(admin)/admin/projects/[id]/ProjectEditForm.tsx
git commit -m "feat: replace imagePath text input with icon picker modal and add ML/IAG checkboxes"
```

---

## Task 7 : Mise à jour de ProjectCard et ProjectList

**Files:**
- Modify: `components/ProjectGrid/ProjectCard/ProjectCard.tsx`
- Modify: `components/ProjectGrid/ProjectList.tsx`

- [ ] **Step 1 : Mettre à jour ProjectCard.tsx**

Remplacer le fichier entier par :

```typescript
import { Bot, Camera, Leaf, Lock, Map, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const LUCIDE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "lucide:Bot": Bot,
  "lucide:Map": Map,
  "lucide:Camera": Camera,
  "lucide:Leaf": Leaf,
  "lucide:Users": Users,
};

type ProjectProps = {
  id: number;
  name: string;
  description: string;
  image_path?: string;
  type: string;
  github: string;
  lastUpdate?: string;
  isPrivate?: boolean;
  isAiGenerated?: boolean;
  isML?: boolean;
  isIAG?: boolean;
  languages?: string[];
  databases?: string[];
  backends?: string[];
  frontends?: string[];
  devops?: string[];
};

export default function ProjectCard({
  name,
  description,
  image_path,
  type,
  github,
  lastUpdate,
  isPrivate = false,
  isAiGenerated = false,
  isML = false,
  isIAG = false,
  languages = [],
  databases = [],
  backends = [],
  frontends = [],
  devops = [],
}: Readonly<ProjectProps>) {
  const allTags = [
    ...languages.map((l) => ({
      label: l,
      color: "bg-yellow-100 text-yellow-800",
    })),
    ...databases.map((d) => ({ label: d, color: "bg-blue-100 text-blue-800" })),
    ...backends.map((b) => ({
      label: b,
      color: "bg-green-100 text-green-800",
    })),
    ...frontends.map((f) => ({
      label: f,
      color: "bg-purple-100 text-purple-800",
    })),
    ...devops.map((d) => ({
      label: d,
      color: "bg-orange-100 text-orange-800",
    })),
  ];

  const formattedDate = lastUpdate
    ? new Date(lastUpdate).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "short",
      })
    : null;

  function renderCardMedia() {
    const effectivePath =
      image_path && image_path.length > 0 ? image_path : "/icon/Github.svg";

    let mediaContent: React.ReactNode;

    if (effectivePath.startsWith("lucide:")) {
      const LucideComponent = LUCIDE_ICON_MAP[effectivePath];
      mediaContent = LucideComponent ? (
        <LucideComponent className="h-24 w-24 text-gray-500 dark:text-gray-400" />
      ) : (
        <Image
          src="/icon/Github.svg"
          alt={`Image du projet ${name}`}
          width={100}
          height={100}
          className="h-24 w-24 object-contain"
        />
      );
    } else {
      const src = effectivePath.startsWith("/")
        ? effectivePath
        : `/${effectivePath}`;
      mediaContent = (
        <Image
          src={src}
          alt={`Image du projet ${name}`}
          width={100}
          height={100}
          className="h-24 w-24 object-contain"
        />
      );
    }

    return (
      <div
        className="flex h-32 w-full items-center justify-center rounded-lg bg-linear-to-br
         from-gray-50 to-gray-100 p-2 dark:from-gray-800 dark:to-gray-900"
      >
        {mediaContent}
      </div>
    );
  }

  return (
    <Card className={`relative overflow-hidden ${isPrivate ? "group" : ""}`}>
      {isPrivate && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[2px] transition-all duration-300 group-hover:bg-white/40 dark:bg-black/60 dark:group-hover:bg-black/40">
          <div className="flex flex-col items-center gap-2 text-gray-600 dark:text-gray-400">
            <Lock className="h-8 w-8" />
            <span className="text-sm font-medium">Projet privé</span>
          </div>
        </div>
      )}

      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{name}</CardTitle>
          <div className="flex gap-1">
            {isAiGenerated && (
              <Badge
                variant="secondary"
                className="bg-linear-to-r from-violet-500 to-fuchsia-500 text-white"
              >
                AI
              </Badge>
            )}
            {isML && (
              <Badge
                variant="secondary"
                className="bg-blue-600 text-white"
              >
                ML
              </Badge>
            )}
            {isIAG && (
              <Badge
                variant="secondary"
                className="bg-linear-to-r from-indigo-500 to-violet-500 text-white"
              >
                IAG
              </Badge>
            )}
            {isPrivate && (
              <Badge variant="outline">
                <Lock className="mr-1 h-3 w-3" />
                Privé
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <CardAction>
          {isPrivate ? (
            <div className="cursor-not-allowed">{renderCardMedia()}</div>
          ) : (
            <Link
              href={github || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              {renderCardMedia()}
            </Link>
          )}
        </CardAction>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTags.slice(0, 5).map((tag) => (
              <Badge key={tag.label} variant="secondary" className={tag.color}>
                {tag.label}
              </Badge>
            ))}
            {allTags.length > 5 && (
              <Badge variant="outline">+{allTags.length - 5}</Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-gray-500">{type}</p>
        {formattedDate && (
          <p className="text-xs text-gray-400">Màj : {formattedDate}</p>
        )}
      </CardFooter>
    </Card>
  );
}
```

- [ ] **Step 2 : Mettre à jour ProjectList.tsx pour passer isML et isIAG**

Dans `components/ProjectGrid/ProjectList.tsx`, modifier l'appel à `<ProjectCard>` pour ajouter les deux nouvelles props :

```typescript
<ProjectCard
  id={project.id}
  name={project.title}
  description={project.description}
  image_path={project.imagePath ?? ""}
  type={project.frontends[0]?.frontend ?? "Autre"}
  github={project.github ?? ""}
  lastUpdate={
    project.lastUpdate instanceof Date
      ? project.lastUpdate.toISOString()
      : (project.lastUpdate ?? undefined)
  }
  isPrivate={project.isPrivate}
  isAiGenerated={project.isAiGenerated}
  isML={project.isML}
  isIAG={project.isIAG}
  languages={project.languages.map((l) => l.language)}
  databases={project.databases.map((d) => d.database)}
  backends={project.backends.map((b) => b.backend)}
  frontends={project.frontends.map((f) => f.frontend)}
  devops={project.devops.map((d) => d.devops)}
/>
```

- [ ] **Step 3 : Vérifier les types et le build**

```bash
pnpm tsc --noEmit
```

Résultat attendu : aucune erreur TypeScript.

```bash
pnpm build
```

Résultat attendu : build réussi sans erreur.

- [ ] **Step 4 : Commit**

```bash
git add components/ProjectGrid/ProjectCard/ProjectCard.tsx components/ProjectGrid/ProjectList.tsx
git commit -m "feat: add ML/IAG badges to ProjectCard and lucide icon rendering"
```
