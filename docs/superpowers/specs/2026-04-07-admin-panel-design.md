# Admin Panel — Design Spec

**Date:** 2026-04-07  
**Status:** Approved

## Overview

Add a protected `/admin` section to the portfolio that lets the owner browse GitHub repos, import them into the PostgreSQL database with auto-detected tech stack, and perform full CRUD on existing projects — replacing the current manual `github-projects.json` + `prisma db seed` workflow.

---

## 1. Authentication

**Library:** Auth.js v5 (NextAuth) with GitHub OAuth provider.

**Protection:** `proxy.ts` at the project root intercepts all `/admin/*` requests. Unauthenticated users are redirected to `/admin/login`. Access is restricted to a single GitHub user ID stored in `ADMIN_GITHUB_ID` env var — even valid GitHub sessions are rejected if the user ID doesn't match.

**File:** `proxy.ts` exports `auth as proxy` from `@/auth` (Next.js 16 convention — `middleware.ts` is renamed to `proxy.ts`).

**Environment variables required:**
```
AUTH_SECRET=          # random secret for session signing
AUTH_GITHUB_ID=       # GitHub OAuth App client ID
AUTH_GITHUB_SECRET=   # GitHub OAuth App client secret
ADMIN_GITHUB_ID=      # your numeric GitHub user ID (gatekeeping)
GITHUB_TOKEN=         # GitHub Personal Access Token for API calls
```

**GitHub OAuth App settings:**
- Homepage URL: `https://willisback.fr`
- Callback URL: `https://willisback.fr/api/auth/callback/github`

---

## 2. File & Folder Structure

```
auth.ts                              # Auth.js config — GitHub OAuth provider
proxy.ts                             # Route protection for /admin/*
app/
  (admin)/
    layout.tsx                       # Admin shell: sidebar + header
    login/
      page.tsx                       # Sign-in page with GitHub button
    dashboard/
      page.tsx                       # Stats overview + quick action buttons
    projects/
      page.tsx                       # Table of all DB projects (edit/delete)
      [id]/
        page.tsx                     # Edit form for a single project
    github/
      page.tsx                       # GitHub repo browser + import flow
lib/
  github.ts                          # GitHub API client
app/
  actions/
    admin.action.ts                  # Server Actions: create, update, delete, import
```

The existing `app/actions/projects.action.ts` (public read actions) is **not modified**.

---

## 3. GitHub Integration & Tech Stack Auto-detection

**API authentication:** GitHub PAT (`GITHUB_TOKEN`) — raises rate limit from 60 to 5000 req/hr.

### Fetch flow

1. `GET /users/{username}/repos?per_page=100&sort=updated` — all public repos with description, primary language, last push date.
2. For each repo selected for import: `GET /repos/{owner}/{repo}/git/trees/HEAD?recursive=1` — file tree scan.

### Auto-detection rules (file tree scan)

| Signal | Detected value |
|--------|---------------|
| `Dockerfile` present | `DevOps.Docker` |
| `.github/workflows/` present | `DevOps.GithubActions` |
| `pyproject.toml` or `requirements.txt` | confirms `Language.Python` |
| `package.json` | confirms `Language.TypeScript` or `Language.JavaScript` |

### Primary language mapping (GitHub API → Prisma enum)

| GitHub language | Prisma enum |
|----------------|------------|
| `Python` | `Language.Python` |
| `TypeScript` | `Language.TypeScript` |
| `JavaScript` | `Language.JavaScript` |
| `Rust` | `Language.Rust` |
| anything else | ignored (fill manually) |

### Import review step

Before writing to DB, each selected repo shows a pre-filled form with:
- Title (editable, defaults to repo name)
- Description (editable, defaults to repo description)
- GitHub URL (read-only)
- Last update (read-only, from `pushed_at`)
- Tech stack checkboxes (languages, databases, backends, frontends, devops) — auto-detected values pre-checked
- Image path (text field, optional)
- `isPrivate` toggle
- `isAiGenerated` toggle

Confirm → calls `importFromGitHub` Server Action → writes to DB → invalidates Next.js `projects` cache tag.

Repos already in the DB are marked "Already imported" in the browser but can be re-imported to update.

---

## 4. Server Actions (`app/actions/admin.action.ts`)

All actions require an authenticated admin session (checked at the start of each action).

| Action | Description |
|--------|-------------|
| `importFromGitHub(repos)` | Upsert one or more projects from reviewed GitHub data |
| `createProject(data)` | Create a project manually |
| `updateProject(id, data)` | Update a project's fields and relations |
| `deleteProject(id)` | Delete a project and cascade relations |

After any mutation, `revalidateTag("projects")` is called to invalidate the public cache.

---

## 5. Admin UI Pages

### `/admin/login`
Minimal page with a single "Sign in with GitHub" button. Redirects to `/admin/dashboard` on success.

### `/admin/dashboard`
- Total projects count
- Last import date
- Quick action buttons: "Browse GitHub repos" → `/admin/github`, "Manage projects" → `/admin/projects`

### `/admin/github`
- Full list of public GitHub repos, sorted by last updated
- Each row: repo name, description, primary language, last push, checkbox
- Search/filter bar by repo name
- "Already imported" badge for repos already in DB
- "Import selected" → opens per-repo review forms (pre-filled, editable)
- Confirm all → saves to DB

### `/admin/projects`
- Table of all DB projects: title, languages, last update, Edit / Delete actions
- Delete shows a confirmation dialog before calling `deleteProject`
- Edit navigates to `/admin/projects/[id]`

### `/admin/projects/[id]`
- Full edit form (same fields as import review form, pre-filled from DB)
- Save calls `updateProject` Server Action

---

## 6. Data Flow Summary

```
GitHub API
    │
    ▼
lib/github.ts  (fetch repos + file tree scan)
    │
    ▼
/admin/github  (repo browser UI + review form)
    │
    ▼
admin.action.ts  importFromGitHub()
    │
    ▼
Prisma / Neon PostgreSQL
    │
    ▼
revalidateTag("projects")  → public portfolio cache cleared
```

---

## 7. Constraints & Notes

- The Prisma enums (Language, Database, BackendApi, Frontend, DevOps) are fixed — no schema changes needed.
- The existing public `getProjects` / `getProjectById` / `getFilterOptions` Server Actions are unchanged.
- `proxy.ts` uses the Next.js 16 convention (replaces `middleware.ts`).
- The admin panel is deployed as part of the same Vercel project — no separate deployment needed.
