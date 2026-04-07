# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a protected `/admin` route group with GitHub OAuth login, a GitHub repo browser for importing projects, and full CRUD on existing DB projects — replacing the manual `github-projects.json` + `prisma db seed` workflow.

**Architecture:** Auth.js v5 with GitHub OAuth protects all `/admin/*` routes via `proxy.ts`. A `lib/github.ts` client fetches repos and auto-detects tech stack from file trees. Admin Server Actions (`app/actions/admin.action.ts`) handle all DB mutations and invalidate the public `projects` cache tag after each write.

**Tech Stack:** Next.js 16, Auth.js v5 (`next-auth`), Prisma (Neon/PostgreSQL), Tailwind CSS v4, Radix UI, Zod v4, Vitest

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `auth.ts` | Create | Auth.js v5 config — GitHub OAuth, session JWT, admin gate |
| `proxy.ts` | Create | Route protection for `/admin/*` (Next.js 16 convention) |
| `app/api/auth/[...nextauth]/route.ts` | Create | Auth.js HTTP handlers |
| `lib/github.ts` | Create | GitHub API client — fetch repos, file tree, tech stack detection |
| `lib/github.test.ts` | Create | Unit tests for `detectTechStack` |
| `vitest.config.ts` | Create | Vitest config with `@` alias |
| `app/actions/admin.action.ts` | Create | Server Actions: create, update, delete, import |
| `app/(admin)/layout.tsx` | Create | Admin shell — sidebar nav + sign-out |
| `app/(admin)/login/page.tsx` | Create | GitHub sign-in page |
| `app/(admin)/dashboard/page.tsx` | Create | Stats overview + quick-action buttons |
| `app/(admin)/github/page.tsx` | Create | Server component — fetches repos, renders browser |
| `app/(admin)/github/GitHubReposBrowser.tsx` | Create | Client component — selection, review form, import |
| `app/(admin)/projects/page.tsx` | Create | Server component — DB project table |
| `app/(admin)/projects/DeleteProjectButton.tsx` | Create | Client component — delete with confirmation dialog |
| `app/(admin)/projects/[id]/page.tsx` | Create | Server component — load project for editing |
| `app/(admin)/projects/[id]/ProjectEditForm.tsx` | Create | Client component — edit form |
| `package.json` | Modify | Add `next-auth`, `vitest` |
| `schemas/index.ts` | Modify | Add `AdminProjectSchema` for form validation |

---

## Task 1: Install dependencies and configure Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install next-auth and vitest**

```bash
cd /home/will/dev-project/portfolio
pnpm add next-auth@5
pnpm add -D vitest @vitest/coverage-v8
```

Expected: packages installed, no peer dependency errors.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 3: Add test script to `package.json`**

In `package.json`, add to the `"scripts"` block:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify vitest runs**

```bash
pnpm test
```

Expected: `No test files found` (or similar — no failures).

- [ ] **Step 5: Commit**

```bash
git add package.json vitest.config.ts pnpm-lock.yaml
git commit -m "chore: add next-auth and vitest"
```

---

## Task 2: Auth.js v5 config + API route handler

**Files:**
- Create: `auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create `auth.ts`**

```ts
// auth.ts
import NextAuth, { type DefaultSession } from "next-auth";
import GitHub from "next-auth/providers/github";

declare module "next-auth" {
  interface Session {
    user: { githubId: string } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  callbacks: {
    jwt({ token, profile }) {
      if (profile?.id) token.githubId = String(profile.id);
      return token;
    },
    session({ session, token }) {
      session.user.githubId = token.githubId as string;
      return session;
    },
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoginPage = nextUrl.pathname === "/admin/login";
      if (isLoginPage) return true;

      if (!session?.user) return false;

      const isAdmin =
        session.user.githubId === process.env.ADMIN_GITHUB_ID;
      if (!isAdmin)
        return Response.redirect(new URL("/admin/login", nextUrl));

      return true;
    },
  },
  pages: { signIn: "/admin/login" },
});
```

- [ ] **Step 2: Create the Auth.js route handler**

```ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 3: Add required env vars to `.env.local`**

Add these to `.env.local` (the file already exists for DB credentials):

```
AUTH_SECRET=<generate with: openssl rand -base64 32>
AUTH_GITHUB_ID=<your GitHub OAuth App client ID>
AUTH_GITHUB_SECRET=<your GitHub OAuth App client secret>
ADMIN_GITHUB_ID=<your numeric GitHub user ID>
GITHUB_TOKEN=<your GitHub Personal Access Token>
```

To find your numeric GitHub user ID: `curl https://api.github.com/users/WillIsback | grep '"id"'`

- [ ] **Step 4: Create GitHub OAuth App**

In GitHub → Settings → Developer settings → OAuth Apps → New OAuth App:
- Homepage URL: `https://www.willisback.fr`
- Callback URL: `https://www.willisback.fr/api/auth/callback/github`

For local dev, create a second OAuth App with callback `http://localhost:3000/api/auth/callback/github`.

- [ ] **Step 5: Commit**

```bash
git add auth.ts app/api/auth/
git commit -m "feat: add Auth.js v5 GitHub OAuth config"
```

---

## Task 3: Route protection via `proxy.ts`

**Files:**
- Create: `proxy.ts`

- [ ] **Step 1: Create `proxy.ts`**

```ts
// proxy.ts
export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 2: Verify the build compiles**

```bash
pnpm build
```

Expected: build succeeds (auth providers only run server-side, no edge runtime issues).

- [ ] **Step 3: Commit**

```bash
git add proxy.ts
git commit -m "feat: protect /admin routes via proxy.ts"
```

---

## Task 4: GitHub API client with unit tests

**Files:**
- Create: `lib/github.ts`
- Create: `lib/github.test.ts`

- [ ] **Step 1: Write failing unit tests first**

```ts
// lib/github.test.ts
import { describe, it, expect } from "vitest";
import { detectTechStack } from "./github";

describe("detectTechStack", () => {
  it("maps TypeScript primary language to enum", () => {
    const result = detectTechStack([], "TypeScript");
    expect(result.languages).toEqual(["TypeScript"]);
  });

  it("maps Python primary language to enum", () => {
    const result = detectTechStack([], "Python");
    expect(result.languages).toEqual(["Python"]);
  });

  it("ignores unknown primary languages", () => {
    const result = detectTechStack([], "Go");
    expect(result.languages).toEqual([]);
  });

  it("ignores null primary language", () => {
    const result = detectTechStack([], null);
    expect(result.languages).toEqual([]);
  });

  it("detects Docker from root Dockerfile", () => {
    const result = detectTechStack(["Dockerfile", "src/main.ts"], "TypeScript");
    expect(result.devops).toContain("Docker");
  });

  it("detects Docker from nested Dockerfile", () => {
    const result = detectTechStack(["docker/Dockerfile"], null);
    expect(result.devops).toContain("Docker");
  });

  it("detects GithubActions from .github/workflows", () => {
    const result = detectTechStack([".github/workflows/ci.yml"], null);
    expect(result.devops).toContain("GithubActions");
  });

  it("returns empty arrays when nothing detected", () => {
    const result = detectTechStack(["README.md"], null);
    expect(result).toEqual({
      languages: [],
      databases: [],
      backends: [],
      frontends: [],
      devops: [],
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test
```

Expected: FAIL — `Cannot find module './github'`

- [ ] **Step 3: Create `lib/github.ts`**

```ts
// lib/github.ts
import type { Language, DevOps } from "@/schemas";

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  pushed_at: string;
  language: string | null;
  private: boolean;
}

export interface DetectedTechStack {
  languages: Language[];
  databases: string[];
  backends: string[];
  frontends: string[];
  devops: DevOps[];
}

const GITHUB_API = "https://api.github.com";

const LANGUAGE_MAP: Record<string, Language> = {
  Python: "Python",
  TypeScript: "TypeScript",
  JavaScript: "JavaScript",
  Rust: "Rust",
};

export function detectTechStack(
  filePaths: string[],
  primaryLanguage: string | null,
): DetectedTechStack {
  const languages: Language[] = [];
  const devops: DevOps[] = [];

  if (primaryLanguage && LANGUAGE_MAP[primaryLanguage]) {
    languages.push(LANGUAGE_MAP[primaryLanguage]);
  }

  const hasDockerfile = filePaths.some(
    (p) => p === "Dockerfile" || p.endsWith("/Dockerfile"),
  );
  if (hasDockerfile) devops.push("Docker");

  const hasGithubActions = filePaths.some((p) =>
    p.startsWith(".github/workflows/"),
  );
  if (hasGithubActions) devops.push("GithubActions");

  return { languages, databases: [], backends: [], frontends: [], devops };
}

export async function fetchUserRepos(username: string): Promise<GitHubRepo[]> {
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(
    `${GITHUB_API}/users/${username}/repos?per_page=100&sort=updated&type=public`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 300 },
    },
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

export async function fetchRepoFilePaths(
  owner: string,
  repo: string,
): Promise<string[]> {
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 300 },
    },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.tree ?? []).map((item: { path: string }) => item.path);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test
```

Expected: 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/github.ts lib/github.test.ts
git commit -m "feat: add GitHub API client with tech stack detection"
```

---

## Task 5: Admin Server Actions

**Files:**
- Modify: `schemas/index.ts` — add `AdminProjectSchema`
- Create: `app/actions/admin.action.ts`

- [ ] **Step 1: Add `AdminProjectSchema` to `schemas/index.ts`**

Add at the end of `schemas/index.ts` (after existing exports):

```ts
// Schema used by admin forms — all tech stack fields required for DB writes
export const AdminProjectSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().min(1, "La description est requise"),
  imagePath: z.string().optional(),
  github: z.string().optional(),
  lastUpdate: z.string().optional(),
  isPrivate: z.boolean().default(false),
  isAiGenerated: z.boolean().default(false),
  languages: z.array(LanguageEnum).default([]),
  databases: z.array(DatabaseEnum).default([]),
  backends: z.array(BackendApiEnum).default([]),
  frontends: z.array(FrontendEnum).default([]),
  devops: z.array(DevOpsEnum).default([]),
});

export type AdminProject = z.infer<typeof AdminProjectSchema>;
```

- [ ] **Step 2: Create `app/actions/admin.action.ts`**

```ts
// app/actions/admin.action.ts
"use server";

import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { AdminProjectSchema, type AdminProject } from "@/schemas";

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (
    !session?.user ||
    session.user.githubId !== process.env.ADMIN_GITHUB_ID
  ) {
    throw new Error("Unauthorized");
  }
}

async function upsertProjectRelations(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  projectId: number,
  data: AdminProject,
): Promise<void> {
  await tx.projectLanguage.deleteMany({ where: { projectId } });
  await tx.projectDatabase.deleteMany({ where: { projectId } });
  await tx.projectBackend.deleteMany({ where: { projectId } });
  await tx.projectFrontend.deleteMany({ where: { projectId } });
  await tx.projectDevOps.deleteMany({ where: { projectId } });

  if (data.languages.length > 0) {
    await tx.projectLanguage.createMany({
      data: data.languages.map((language) => ({ projectId, language })),
    });
  }
  if (data.databases.length > 0) {
    await tx.projectDatabase.createMany({
      data: data.databases.map((database) => ({ projectId, database })),
    });
  }
  if (data.backends.length > 0) {
    await tx.projectBackend.createMany({
      data: data.backends.map((backend) => ({ projectId, backend })),
    });
  }
  if (data.frontends.length > 0) {
    await tx.projectFrontend.createMany({
      data: data.frontends.map((frontend) => ({ projectId, frontend })),
    });
  }
  if (data.devops.length > 0) {
    await tx.projectDevOps.createMany({
      data: data.devops.map((devops) => ({ projectId, devops })),
    });
  }
}

export async function createProject(raw: AdminProject): Promise<void> {
  await requireAdmin();
  const data = AdminProjectSchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        title: data.title,
        description: data.description,
        imagePath: data.imagePath ?? null,
        github: data.github ?? "",
        lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : null,
        isPrivate: data.isPrivate,
        isAiGenerated: data.isAiGenerated,
      },
    });
    await upsertProjectRelations(tx, project.id, data);
  });

  revalidateTag("projects");
}

export async function updateProject(
  id: number,
  raw: AdminProject,
): Promise<void> {
  await requireAdmin();
  const data = AdminProjectSchema.parse(raw);

  await prisma.$transaction(async (tx) => {
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
      },
    });
    await upsertProjectRelations(tx, id, data);
  });

  revalidateTag("projects");
}

export async function deleteProject(id: number): Promise<void> {
  await requireAdmin();
  await prisma.project.delete({ where: { id } });
  revalidateTag("projects");
}

export async function importFromGitHub(projects: AdminProject[]): Promise<void> {
  await requireAdmin();
  const validated = projects.map((p) => AdminProjectSchema.parse(p));

  for (const data of validated) {
    const existing = data.github
      ? await prisma.project.findFirst({ where: { github: data.github } })
      : null;

    if (existing) {
      await updateProject(existing.id, data);
    } else {
      await createProject(data);
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add schemas/index.ts app/actions/admin.action.ts
git commit -m "feat: add admin server actions (CRUD + GitHub import)"
```

---

## Task 6: Admin layout and login page

**Files:**
- Create: `app/(admin)/layout.tsx`
- Create: `app/(admin)/login/page.tsx`

- [ ] **Step 1: Create `app/(admin)/layout.tsx`**

```tsx
// app/(admin)/layout.tsx
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="w-56 border-r border-zinc-800 flex flex-col p-4 gap-1 shrink-0">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4 font-mono">
          Admin
        </p>
        <Link
          href="/admin/dashboard"
          className="text-sm text-zinc-400 hover:text-white py-1.5 px-2 rounded hover:bg-zinc-800 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/admin/github"
          className="text-sm text-zinc-400 hover:text-white py-1.5 px-2 rounded hover:bg-zinc-800 transition-colors"
        >
          Import from GitHub
        </Link>
        <Link
          href="/admin/projects"
          className="text-sm text-zinc-400 hover:text-white py-1.5 px-2 rounded hover:bg-zinc-800 transition-colors"
        >
          Projects
        </Link>
        <div className="mt-auto pt-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-600 mb-2 truncate">
            {session.user?.name}
          </p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button
              type="submit"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/(admin)/login/page.tsx`**

```tsx
// app/(admin)/login/page.tsx
import { signIn } from "@/auth";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 flex flex-col items-center gap-6 w-80">
        <h1 className="text-lg font-semibold text-zinc-100 font-mono">
          Admin
        </h1>
        <p className="text-sm text-zinc-500 text-center">
          Accès réservé au propriétaire du portfolio.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/admin/dashboard" });
          }}
        >
          <button
            type="submit"
            className="bg-zinc-100 text-zinc-900 px-5 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors"
          >
            Sign in with GitHub
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Start dev server and manually verify login flow**

```bash
pnpm dev
```

Navigate to `http://localhost:3000/admin/dashboard` — should redirect to `/admin/login`.
Click "Sign in with GitHub" — should authenticate and redirect to `/admin/dashboard` (which will 404 until Task 7).

- [ ] **Step 4: Commit**

```bash
git add app/\(admin\)/
git commit -m "feat: add admin layout and login page"
```

---

## Task 7: Dashboard page

**Files:**
- Create: `app/(admin)/dashboard/page.tsx`

- [ ] **Step 1: Create `app/(admin)/dashboard/page.tsx`**

```tsx
// app/(admin)/dashboard/page.tsx
import Link from "next/link";
import prisma from "@/lib/db";

export default async function AdminDashboardPage() {
  const projectCount = await prisma.project.count();
  const latest = await prisma.project.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true, title: true },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold font-mono mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">
            Projects in DB
          </p>
          <p className="text-3xl font-bold font-mono">{projectCount}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">
            Last updated
          </p>
          <p className="text-sm font-mono text-zinc-300">
            {latest?.title ?? "—"}
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            {latest?.updatedAt.toLocaleDateString("fr-FR") ?? ""}
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link
          href="/admin/github"
          className="bg-zinc-100 text-zinc-900 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white transition-colors"
        >
          Import from GitHub
        </Link>
        <Link
          href="/admin/projects"
          className="border border-zinc-700 text-zinc-300 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors"
        >
          Manage Projects
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify dashboard renders**

Navigate to `http://localhost:3000/admin/dashboard` after signing in.
Expected: project count displayed, quick-action buttons visible.

- [ ] **Step 3: Commit**

```bash
git add app/\(admin\)/dashboard/
git commit -m "feat: add admin dashboard page"
```

---

## Task 8: GitHub repo browser page

**Files:**
- Create: `app/(admin)/github/page.tsx`
- Create: `app/(admin)/github/GitHubReposBrowser.tsx`

- [ ] **Step 1: Create server component `app/(admin)/github/page.tsx`**

```tsx
// app/(admin)/github/page.tsx
import { fetchUserRepos } from "@/lib/github";
import prisma from "@/lib/db";
import { GitHubReposBrowser } from "./GitHubReposBrowser";

export default async function AdminGitHubPage() {
  const [repos, dbProjects] = await Promise.all([
    fetchUserRepos("WillIsback"),
    prisma.project.findMany({ select: { github: true } }),
  ]);

  const importedUrls = new Set(dbProjects.map((p) => p.github).filter(Boolean));

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold font-mono mb-2">Import from GitHub</h1>
      <p className="text-sm text-zinc-500 mb-8">
        {repos.length} public repos found. Select repos to import into the DB.
      </p>
      <GitHubReposBrowser repos={repos} importedUrls={Array.from(importedUrls) as string[]} />
    </div>
  );
}
```

- [ ] **Step 2: Create client component `app/(admin)/github/GitHubReposBrowser.tsx`**

```tsx
// app/(admin)/github/GitHubReposBrowser.tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { fetchRepoFilePaths, detectTechStack, type GitHubRepo } from "@/lib/github";
import { importFromGitHub } from "@/app/actions/admin.action";
import type { AdminProject } from "@/schemas";
import {
  LanguageEnum,
  DatabaseEnum,
  BackendApiEnum,
  FrontendEnum,
  DevOpsEnum,
} from "@/schemas";

interface ReviewProject extends AdminProject {
  repoName: string;
}

export function GitHubReposBrowser({
  repos,
  importedUrls,
}: {
  repos: GitHubRepo[];
  importedUrls: string[];
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reviewProjects, setReviewProjects] = useState<ReviewProject[] | null>(null);
  const [isPreparing, startPreparing] = useTransition();
  const [isImporting, startImporting] = useTransition();

  const importedSet = new Set(importedUrls);

  const filtered = repos.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  function toggleRepo(htmlUrl: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(htmlUrl)) next.delete(htmlUrl);
      else next.add(htmlUrl);
      return next;
    });
  }

  async function prepareReview() {
    startPreparing(async () => {
      const selectedRepos = repos.filter((r) => selected.has(r.html_url));
      const previews: ReviewProject[] = await Promise.all(
        selectedRepos.map(async (repo) => {
          const [owner, name] = repo.full_name.split("/");
          const filePaths = await fetchRepoFilePaths(owner, name);
          const detected = detectTechStack(filePaths, repo.language);
          return {
            repoName: repo.name,
            title: repo.name,
            description: repo.description ?? "",
            github: repo.html_url,
            lastUpdate: repo.pushed_at,
            isPrivate: false,
            isAiGenerated: false,
            imagePath: "",
            languages: detected.languages,
            databases: [],
            backends: [],
            frontends: [],
            devops: detected.devops,
          };
        }),
      );
      setReviewProjects(previews);
    });
  }

  function updateReviewField<K extends keyof ReviewProject>(
    index: number,
    field: K,
    value: ReviewProject[K],
  ) {
    setReviewProjects((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function toggleArrayValue<T extends string>(
    index: number,
    field: keyof ReviewProject,
    value: T,
  ) {
    setReviewProjects((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const current = (next[index][field] as T[]) ?? [];
      next[index] = {
        ...next[index],
        [field]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
      return next;
    });
  }

  function handleImport() {
    if (!reviewProjects) return;
    startImporting(async () => {
      try {
        await importFromGitHub(reviewProjects);
        toast.success(`${reviewProjects.length} project(s) imported successfully`);
        setReviewProjects(null);
        setSelected(new Set());
      } catch {
        toast.error("Import failed — check console");
      }
    });
  }

  if (reviewProjects) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold font-mono">
            Review {reviewProjects.length} project(s)
          </h2>
          <button
            type="button"
            onClick={() => setReviewProjects(null)}
            className="text-sm text-zinc-500 hover:text-zinc-300"
          >
            ← Back
          </button>
        </div>

        {reviewProjects.map((proj, i) => (
          <div
            key={proj.github}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4"
          >
            <h3 className="font-mono text-zinc-300 text-sm">{proj.repoName}</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Title</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
                  value={proj.title}
                  onChange={(e) => updateReviewField(i, "title", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Image path</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
                  value={proj.imagePath ?? ""}
                  placeholder="logo/example.svg"
                  onChange={(e) => updateReviewField(i, "imagePath", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 block mb-1">Description</label>
              <textarea
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 min-h-[80px]"
                value={proj.description}
                onChange={(e) => updateReviewField(i, "description", e.target.value)}
              />
            </div>

            <TechStackCheckboxes
              label="Languages"
              options={LanguageEnum.options}
              selected={proj.languages}
              onChange={(v) => toggleArrayValue(i, "languages", v)}
            />
            <TechStackCheckboxes
              label="Databases"
              options={DatabaseEnum.options}
              selected={proj.databases}
              onChange={(v) => toggleArrayValue(i, "databases", v)}
            />
            <TechStackCheckboxes
              label="Backend APIs"
              options={BackendApiEnum.options}
              selected={proj.backends}
              onChange={(v) => toggleArrayValue(i, "backends", v)}
            />
            <TechStackCheckboxes
              label="Frontend"
              options={FrontendEnum.options}
              selected={proj.frontends}
              onChange={(v) => toggleArrayValue(i, "frontends", v)}
            />
            <TechStackCheckboxes
              label="DevOps"
              options={DevOpsEnum.options}
              selected={proj.devops}
              onChange={(v) => toggleArrayValue(i, "devops", v)}
            />

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={proj.isPrivate}
                  onChange={(e) => updateReviewField(i, "isPrivate", e.target.checked)}
                  className="accent-zinc-400"
                />
                Private
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={proj.isAiGenerated}
                  onChange={(e) =>
                    updateReviewField(i, "isAiGenerated", e.target.checked)
                  }
                  className="accent-zinc-400"
                />
                AI Generated
              </label>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleImport}
          disabled={isImporting}
          className="bg-zinc-100 text-zinc-900 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-white transition-colors disabled:opacity-50"
        >
          {isImporting ? "Importing…" : "Confirm Import"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 w-72 focus:outline-none focus:border-zinc-600"
          placeholder="Search repos…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {selected.size > 0 && (
          <button
            type="button"
            onClick={prepareReview}
            disabled={isPreparing}
            className="bg-zinc-100 text-zinc-900 px-5 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors disabled:opacity-50"
          >
            {isPreparing ? "Preparing…" : `Review & Import (${selected.size})`}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {filtered.map((repo) => (
          <label
            key={repo.id}
            className="flex items-start gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-zinc-700 transition-colors"
          >
            <input
              type="checkbox"
              checked={selected.has(repo.html_url)}
              onChange={() => toggleRepo(repo.html_url)}
              className="mt-0.5 accent-zinc-400"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-zinc-200">{repo.name}</span>
                {importedSet.has(repo.html_url) && (
                  <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">
                    imported
                  </span>
                )}
                {repo.language && (
                  <span className="text-xs text-zinc-600">{repo.language}</span>
                )}
              </div>
              {repo.description && (
                <p className="text-xs text-zinc-500 mt-1 truncate">
                  {repo.description}
                </p>
              )}
            </div>
            <span className="text-xs text-zinc-600 shrink-0">
              {new Date(repo.pushed_at).toLocaleDateString("fr-FR")}
            </span>
          </label>
        ))}
      </div>
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

- [ ] **Step 3: Verify GitHub browser renders and import works**

Navigate to `http://localhost:3000/admin/github`.
Expected: list of your public repos, searchable, selectable. Select one, click "Review & Import", confirm. Check dashboard — count should increase.

- [ ] **Step 4: Commit**

```bash
git add app/\(admin\)/github/
git commit -m "feat: add GitHub repo browser with import flow"
```

---

## Task 9: Projects list page with delete

**Files:**
- Create: `app/(admin)/projects/page.tsx`
- Create: `app/(admin)/projects/DeleteProjectButton.tsx`

- [ ] **Step 1: Create `app/(admin)/projects/DeleteProjectButton.tsx`**

```tsx
// app/(admin)/projects/DeleteProjectButton.tsx
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteProject } from "@/app/actions/admin.action";

export function DeleteProjectButton({ id, title }: { id: number; title: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteProject(id);
        toast.success(`"${title}" deleted`);
      } catch {
        toast.error("Delete failed");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
```

- [ ] **Step 2: Create `app/(admin)/projects/page.tsx`**

```tsx
// app/(admin)/projects/page.tsx
import Link from "next/link";
import prisma from "@/lib/db";
import { DeleteProjectButton } from "./DeleteProjectButton";

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      github: true,
      updatedAt: true,
      languages: { select: { language: true } },
    },
  });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold font-mono">Projects</h1>
        <span className="text-sm text-zinc-500">{projects.length} total</span>
      </div>

      <div className="space-y-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">
                {project.title}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">
                {project.languages.map((l) => l.language).join(", ") || "—"} ·{" "}
                {project.updatedAt.toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <Link
                href={`/admin/projects/${project.id}`}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Edit
              </Link>
              <DeleteProjectButton id={project.id} title={project.title} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify projects list renders and delete works**

Navigate to `http://localhost:3000/admin/projects`.
Expected: list of all DB projects. Click Delete on one → confirm dialog → project removed, toast shown.

- [ ] **Step 4: Commit**

```bash
git add app/\(admin\)/projects/page.tsx app/\(admin\)/projects/DeleteProjectButton.tsx
git commit -m "feat: add admin projects list with delete"
```

---

## Task 10: Edit project page

**Files:**
- Create: `app/(admin)/projects/[id]/page.tsx`
- Create: `app/(admin)/projects/[id]/ProjectEditForm.tsx`

- [ ] **Step 1: Create `app/(admin)/projects/[id]/ProjectEditForm.tsx`**

```tsx
// app/(admin)/projects/[id]/ProjectEditForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProject } from "@/app/actions/admin.action";
import {
  LanguageEnum,
  DatabaseEnum,
  BackendApiEnum,
  FrontendEnum,
  DevOpsEnum,
  type AdminProject,
} from "@/schemas";

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

  function setField<K extends keyof AdminProject>(key: K, value: AdminProject[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArrayValue<T extends string>(key: keyof AdminProject, value: T) {
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Title</label>
          <input
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Image path</label>
          <input
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
            value={form.imagePath ?? ""}
            placeholder="logo/example.svg"
            onChange={(e) => setField("imagePath", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-zinc-500 block mb-1">Description</label>
        <textarea
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 min-h-[100px]"
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs text-zinc-500 block mb-1">GitHub URL</label>
        <input
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

      <div className="flex gap-4">
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

- [ ] **Step 2: Create `app/(admin)/projects/[id]/page.tsx`**

```tsx
// app/(admin)/projects/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db";
import { ProjectEditForm } from "./ProjectEditForm";
import type { AdminProject } from "@/schemas";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id: Number(id) },
    include: {
      languages: true,
      databases: true,
      backends: true,
      frontends: true,
      devops: true,
    },
  });

  if (!project) notFound();

  const initial: AdminProject = {
    title: project.title,
    description: project.description,
    imagePath: project.imagePath ?? "",
    github: project.github ?? "",
    lastUpdate: project.lastUpdate?.toISOString() ?? "",
    isPrivate: project.isPrivate,
    isAiGenerated: project.isAiGenerated,
    languages: project.languages.map((l) => l.language),
    databases: project.databases.map((d) => d.database),
    backends: project.backends.map((b) => b.backend),
    frontends: project.frontends.map((f) => f.frontend),
    devops: project.devops.map((d) => d.devops),
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/projects"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Projects
        </Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-xl font-bold font-mono">{project.title}</h1>
      </div>
      <ProjectEditForm id={project.id} initial={initial} />
    </div>
  );
}
```

- [ ] **Step 3: Verify edit page works end-to-end**

Navigate to `/admin/projects`, click Edit on a project.
Expected: form pre-filled with project data. Change the description, click Save — redirect to `/admin/projects`, toast shown, description updated.

- [ ] **Step 4: Add `GITHUB_TOKEN`, `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `ADMIN_GITHUB_ID` to Vercel environment variables**

In Vercel dashboard → Project Settings → Environment Variables, add all five env vars for the Production environment.

- [ ] **Step 5: Final commit**

```bash
git add app/\(admin\)/projects/\[id\]/
git commit -m "feat: add admin project edit page"
```

- [ ] **Step 6: Deploy and verify on production**

```bash
git push origin main
```

Navigate to `https://www.willisback.fr/admin` — should redirect to login. Sign in with GitHub — should land on dashboard. Import a repo, edit a project, delete a project. Verify public portfolio at `willisback.fr` reflects changes.

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|-----------------|-----------|
| Auth.js v5 GitHub OAuth | Task 2 |
| proxy.ts route protection (Next.js 16) | Task 3 |
| ADMIN_GITHUB_ID gating | Task 2 (`authorized` callback) |
| GitHub API client + PAT | Task 4 |
| Auto-detect Docker, GithubActions, languages | Task 4 (`detectTechStack`) |
| Import review form with editable tech stack | Task 8 |
| "Already imported" badge | Task 8 (server component) |
| importFromGitHub server action | Task 5 |
| createProject server action | Task 5 |
| updateProject server action | Task 5 |
| deleteProject server action | Task 5 |
| `revalidateTag("projects")` after mutation | Task 5 |
| Admin layout + sidebar nav | Task 6 |
| Login page with GitHub button | Task 6 |
| Dashboard with stats | Task 7 |
| Projects list with Edit/Delete | Task 9 |
| Edit project page | Task 10 |
| Existing `projects.action.ts` untouched | Not modified anywhere |

All spec requirements covered. ✓
