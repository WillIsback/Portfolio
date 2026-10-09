"use client";

import { useState } from "react";
import { importRepo } from "@/app/actions/admin.action";
import { AI_DOMAINS, DOMAIN_LABELS } from "@/lib/domains";
import { type AnalyzeOk, formatPushed, repoName } from "@/lib/github/board";
import {
	BackendApiEnum,
	DatabaseEnum,
	DevOpsEnum,
	FrontendEnum,
	LanguageEnum,
	MlStackEnum,
} from "@/schemas";

type ListKey =
	| "languages"
	| "databases"
	| "backends"
	| "frontends"
	| "devops"
	| "mlStack"
	| "domains";

const GROUPS: { key: ListKey; legend: string; options: readonly string[] }[] = [
	{ key: "languages", legend: "Langages", options: LanguageEnum.options },
	{
		key: "databases",
		legend: "Bases de données",
		options: DatabaseEnum.options,
	},
	{ key: "backends", legend: "Back-end", options: BackendApiEnum.options },
	{ key: "frontends", legend: "Front-end", options: FrontendEnum.options },
	{ key: "devops", legend: "DevOps", options: DevOpsEnum.options },
	{ key: "mlStack", legend: "Stack ML", options: MlStackEnum.options },
	{ key: "domains", legend: "Domaines", options: AI_DOMAINS },
];

import { ChipGroup } from "./ChipGroup";

const field =
	"w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-300";

/** Formulaire de relecture d'un nouveau dépôt, pré-rempli par la détection. */
export function ImportForm({
	result,
	onDone,
}: {
	result: AnalyzeOk;
	onDone: (message: string) => void;
}) {
	const { remote } = result;
	const [title, setTitle] = useState(repoName(remote.fullName));
	const [description, setDescription] = useState(remote.description ?? "");
	const [isPrivate, setIsPrivate] = useState(remote.isPrivate);
	const [lists, setLists] = useState<Record<ListKey, string[]>>({
		languages: remote.languages ?? [],
		databases: remote.databases ?? [],
		backends: remote.backends ?? [],
		frontends: remote.frontends ?? [],
		devops: remote.devops ?? [],
		mlStack: remote.mlStack ?? [],
		domains: remote.domains ?? [],
	});
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const id = `imp-${remote.id}`;

	const toggle = (key: ListKey, value: string) =>
		setLists((prev) => ({
			...prev,
			[key]: prev[key].includes(value)
				? prev[key].filter((v) => v !== value)
				: [...prev[key], value],
		}));

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		const res = await importRepo({
			title,
			description,
			github: `https://github.com/${remote.fullName}`,
			githubRepoId: remote.id,
			lastUpdate: remote.pushedAt?.toISOString(),
			isPrivate,
			...lists,
		});
		setBusy(false);
		if (res.ok) onDone("Projet créé.");
		else setError(res.error);
	}

	return (
		<form onSubmit={submit} className="space-y-4">
			<p className="text-xs text-zinc-500">
				Nouveau projet depuis{" "}
				<span className="font-mono">{remote.fullName}</span> (id {remote.id},
				dernier push {formatPushed(remote.pushedAt)}). Relis les valeurs
				détectées avant de créer.
			</p>
			<div>
				<label
					htmlFor={`${id}-title`}
					className="text-xs text-zinc-500 block mb-1"
				>
					Titre
				</label>
				<input
					id={`${id}-title`}
					className={field}
					value={title}
					required
					onChange={(e) => setTitle(e.target.value)}
				/>
			</div>
			<div>
				<label
					htmlFor={`${id}-desc`}
					className="text-xs text-zinc-500 block mb-1"
				>
					Description
				</label>
				<textarea
					id={`${id}-desc`}
					className={`${field} min-h-[80px]`}
					value={description}
					required
					onChange={(e) => setDescription(e.target.value)}
				/>
			</div>
			{GROUPS.map((g) => (
				<ChipGroup
					key={g.key}
					legend={g.legend}
					options={g.options}
					selected={lists[g.key]}
					labels={g.key === "domains" ? DOMAIN_LABELS : undefined}
					onToggle={(v) => toggle(g.key, v)}
				/>
			))}
			<label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
				<input
					type="checkbox"
					checked={isPrivate}
					onChange={(e) => setIsPrivate(e.target.checked)}
					className="accent-zinc-400"
				/>
				Dépôt privé
			</label>
			{result.images.length > 0 && (
				<details className="text-xs text-zinc-500">
					<summary className="cursor-pointer">
						{result.images.length} image(s) trouvée(s) dans le dépôt (capture à
						choisir ensuite dans la fiche)
					</summary>
					<ul className="mt-1 font-mono">
						{result.images.map((p) => (
							<li key={p}>{p}</li>
						))}
					</ul>
				</details>
			)}
			{error && (
				<p role="alert" className="text-sm text-red-300">
					{error}
				</p>
			)}
			<button
				type="submit"
				disabled={busy}
				className="bg-zinc-100 text-zinc-900 px-5 py-2 rounded-lg text-sm font-medium hover:bg-white disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-zinc-300"
			>
				{busy ? "Création…" : "Créer le projet"}
			</button>
		</form>
	);
}
