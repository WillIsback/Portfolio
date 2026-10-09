"use client";

import { useState } from "react";
import { applySync } from "@/app/actions/admin.action";
import { FIELD_LABELS, formatValue } from "@/lib/github/board";
import type { FieldDiff } from "@/lib/github/sync";

const chip = "inline-block rounded px-1.5 py-0.5 text-xs font-mono";

/** Écarts champ par champ : une case par ligne, rien de coché par défaut. */
export function DiffPanel({
	projectId,
	fullName,
	diff,
	onDone,
}: {
	projectId: number;
	fullName: string;
	diff: FieldDiff[];
	onDone: (message: string) => void;
}) {
	const [checked, setChecked] = useState<Set<string>>(new Set());
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const toggle = (field: string) =>
		setChecked((prev) => {
			const next = new Set(prev);
			if (next.has(field)) next.delete(field);
			else next.add(field);
			return next;
		});

	async function apply() {
		setBusy(true);
		setError(null);
		const res = await applySync(projectId, fullName, [...checked]);
		setBusy(false);
		if (res.ok) onDone(`${checked.size} champ(s) appliqué(s).`);
		else setError(res.error);
	}

	if (diff.length === 0)
		return (
			<p className="text-sm text-zinc-400">Aucun écart : projet à jour.</p>
		);

	return (
		<div className="space-y-3">
			<p className="text-xs text-zinc-500">
				Coche les champs à écrire. Un champ décoché garde sa valeur actuelle, y
				compris les valeurs retirées que la détection ne peut pas voir (ex. une
				technologie ajoutée à la main).
			</p>
			<ul className="space-y-2">
				{diff.map((d) => {
					const id = `diff-${projectId}-${d.field}`;
					const label =
						d.field === "status"
							? "Passer le statut à archivé"
							: d.kind === "list"
								? `${FIELD_LABELS[d.field]} : remplacer par la liste GitHub`
								: FIELD_LABELS[d.field];
					return (
						<li
							key={d.field}
							className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2"
						>
							<div className="flex items-start gap-3">
								<input
									id={id}
									type="checkbox"
									checked={checked.has(d.field)}
									onChange={() => toggle(d.field)}
									className="mt-1 accent-zinc-400"
								/>
								<div className="min-w-0 flex-1 text-sm">
									<label htmlFor={id} className="text-zinc-200 cursor-pointer">
										{label}
									</label>
									{d.kind === "scalar" ? (
										<p className="text-xs text-zinc-400 mt-1 break-words">
											<span className="text-zinc-500">Actuel :</span>{" "}
											{formatValue(d.field, d.current)}{" "}
											<span aria-hidden="true">→</span>{" "}
											<span className="text-zinc-500">GitHub :</span>{" "}
											{formatValue(d.field, d.proposed)}
										</p>
									) : (
										<div className="mt-1 flex flex-wrap items-center gap-1.5">
											{d.added.map((v) => (
												<span
													key={`a-${v}`}
													className={`${chip} bg-emerald-950 text-emerald-300`}
												>
													<span className="sr-only">Ajout : </span>+ {v}
												</span>
											))}
											{d.removed.map((v) => (
												<span
													key={`r-${v}`}
													className={`${chip} bg-red-950 text-red-300`}
												>
													<span className="sr-only">Retrait : </span>− {v}
												</span>
											))}
											{d.removed.length > 0 && (
												<span className="text-xs text-zinc-500">
													Décoché = valeur actuelle conservée.
												</span>
											)}
										</div>
									)}
								</div>
							</div>
						</li>
					);
				})}
			</ul>
			{error && (
				<p role="alert" className="text-sm text-red-300">
					{error}
				</p>
			)}
			<button
				type="button"
				onClick={apply}
				disabled={busy || checked.size === 0}
				className="bg-zinc-100 text-zinc-900 px-5 py-2 rounded-lg text-sm font-medium hover:bg-white disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-zinc-300"
			>
				{busy ? "Écriture…" : `Appliquer (${checked.size})`}
			</button>
		</div>
	);
}
