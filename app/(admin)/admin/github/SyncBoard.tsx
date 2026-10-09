"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { analyzeRepo } from "@/app/actions/admin.action";
import {
	type AnalyzeResult,
	type BoardProject,
	buildBoardRows,
	formatPushed,
	STATUS_LABELS,
	summarizeDiff,
} from "@/lib/github/board";
import type { RemoteRepo, SyncStatus } from "@/lib/github/sync";
import { DiffPanel } from "./DiffPanel";
import { ImportForm } from "./ImportForm";

const STATUS_STYLE: Record<SyncStatus, string> = {
	new: "bg-sky-950 text-sky-300",
	"up-to-date": "bg-zinc-800 text-zinc-400",
	modified: "bg-amber-950 text-amber-300",
	archived: "bg-orange-950 text-orange-300",
	renamed: "bg-violet-950 text-violet-300",
	missing: "bg-red-950 text-red-300",
};

const btn =
	"text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-zinc-300";

export function SyncBoard({
	repos,
	projects,
}: {
	repos: RemoteRepo[];
	projects: BoardProject[];
}) {
	const router = useRouter();
	const rows = buildBoardRows(repos, projects);
	const [results, setResults] = useState<Record<string, AnalyzeResult>>({});
	const [loading, setLoading] = useState<string | null>(null);
	const [open, setOpen] = useState<Set<string>>(new Set());
	const [flash, setFlash] = useState<Record<string, string>>({});
	const [progress, setProgress] = useState<{
		done: number;
		total: number;
		current: string;
	} | null>(null);
	const [announce, setAnnounce] = useState("");
	const stop = useRef(false);

	async function analyze(key: string, fullName: string) {
		setLoading(key);
		const res = await analyzeRepo(fullName);
		setResults((prev) => ({ ...prev, [key]: res }));
		setLoading(null);
		return res;
	}

	async function analyzeOne(key: string, fullName: string) {
		setAnnounce(`Analyse de ${fullName}…`);
		const res = await analyze(key, fullName);
		setOpen((prev) => new Set(prev).add(key));
		setAnnounce(
			res.ok
				? `${fullName} analysé : ${summarizeDiff(res.diff)}.`
				: `${fullName} : ${res.error}`,
		);
	}

	async function analyzeAll() {
		const targets = rows.filter((r) => r.repo);
		stop.current = false;
		let done = 0;
		for (const row of targets) {
			if (stop.current) break;
			const fullName = row.repo?.fullName ?? "";
			setProgress({ done, total: targets.length, current: fullName });
			setAnnounce(`Analyse ${done + 1} sur ${targets.length} : ${fullName}`);
			await analyze(row.key, fullName);
			done++;
		}
		setProgress(null);
		setAnnounce(
			stop.current
				? `Analyse arrêtée après ${done} dépôt(s).`
				: `Analyse terminée : ${done} dépôt(s).`,
		);
	}

	function finished(key: string, message: string) {
		setFlash((prev) => ({ ...prev, [key]: message }));
		setResults((prev) => {
			const next = { ...prev };
			delete next[key];
			return next;
		});
		setOpen((prev) => {
			const next = new Set(prev);
			next.delete(key);
			return next;
		});
		router.refresh();
	}

	const toggleOpen = (key: string) =>
		setOpen((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});

	const busy = loading !== null || progress !== null;

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-3">
				<button
					type="button"
					className={btn}
					disabled={busy}
					onClick={analyzeAll}
				>
					Analyser tout
				</button>
				{progress && (
					<button
						type="button"
						className={btn}
						onClick={() => {
							stop.current = true;
						}}
					>
						Arrêter
					</button>
				)}
				<span className="text-xs text-zinc-500">
					{repos.length} dépôt(s), {projects.length} projet(s) en base
				</span>
			</div>
			{progress && (
				<progress
					className="w-full h-1.5"
					aria-label="Progression de l'analyse"
					value={progress.done}
					max={progress.total}
				/>
			)}
			<p aria-live="polite" className="text-xs text-zinc-400 min-h-4">
				{announce}
			</p>

			<table className="w-full text-left text-sm">
				<caption className="sr-only">
					Dépôts GitHub et projets, avec leur statut de synchronisation
				</caption>
				<thead>
					<tr className="text-xs text-zinc-500 border-b border-zinc-800">
						<th scope="col" className="py-2 pr-3 font-normal">
							Dépôt
						</th>
						<th scope="col" className="py-2 pr-3 font-normal">
							Statut
						</th>
						<th scope="col" className="py-2 pr-3 font-normal">
							Dernier push
						</th>
						<th scope="col" className="py-2 font-normal">
							Analyse
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => {
						const result = results[row.key];
						const isOpen = open.has(row.key);
						const name =
							row.repo?.fullName ??
							row.project?.github?.replace(/^https:\/\/github\.com\//, "") ??
							row.key;
						return (
							<RowGroup key={row.key}>
								<tr className="border-b border-zinc-900 align-top">
									<th scope="row" className="py-3 pr-3 font-normal">
										<span className="font-mono text-zinc-200 break-all">
											{name}
										</span>
										{row.project && (
											<span className="block text-xs text-zinc-500">
												Projet : {row.project.title}
											</span>
										)}
										{row.repo?.isPrivate && (
											<span className="text-xs text-zinc-500"> · privé</span>
										)}
									</th>
									<td className="py-3 pr-3">
										<span
											className={`text-xs px-2 py-0.5 rounded ${STATUS_STYLE[row.status]}`}
										>
											{STATUS_LABELS[row.status]}
										</span>
										{flash[row.key] && (
											<span className="block text-xs text-emerald-400 mt-1">
												{flash[row.key]}
											</span>
										)}
									</td>
									<td className="py-3 pr-3 text-xs text-zinc-500">
										{formatPushed(row.repo?.pushedAt ?? null)}
									</td>
									<td className="py-3">
										{row.repo ? (
											<div className="flex flex-wrap items-center gap-2">
												<button
													type="button"
													className={btn}
													disabled={busy}
													onClick={() =>
														analyzeOne(row.key, row.repo?.fullName ?? "")
													}
												>
													{loading === row.key ? "Analyse…" : "Analyser"}
													<span className="sr-only"> {name}</span>
												</button>
												{result && !result.ok && (
													<span role="alert" className="text-xs text-red-300">
														{result.error}
													</span>
												)}
												{result?.ok && (
													<>
														<span className="text-xs text-zinc-400">
															{result.projectId === null
																? "à importer"
																: summarizeDiff(result.diff)}
														</span>
														<button
															type="button"
															className={btn}
															aria-expanded={isOpen}
															onClick={() => toggleOpen(row.key)}
														>
															{isOpen ? "Masquer" : "Voir"}
															<span className="sr-only">
																{" "}
																le détail de {name}
															</span>
														</button>
													</>
												)}
											</div>
										) : (
											<span className="text-xs text-zinc-500">
												Dépôt introuvable ou inaccessible.
											</span>
										)}
									</td>
								</tr>
								{result?.ok && isOpen && row.repo && (
									<tr className="border-b border-zinc-900">
										<td colSpan={4} className="py-4">
											<div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
												{result.projectId === null ? (
													<ImportForm
														result={result}
														onDone={(m) => finished(row.key, m)}
													/>
												) : (
													<DiffPanel
														projectId={result.projectId}
														fullName={row.repo.fullName}
														diff={result.diff}
														onDone={(m) => finished(row.key, m)}
													/>
												)}
											</div>
										</td>
									</tr>
								)}
							</RowGroup>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}

function RowGroup({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
