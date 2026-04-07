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
