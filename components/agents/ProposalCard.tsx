"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { applyProjectProposal } from "@/app/actions/agents.action";
import type { ProjectProposal } from "@/lib/agents/proposals";
import { summarizeProposal } from "@/lib/agents/proposals";

const LABELS: Record<ProjectProposal["action"], string> = {
	create: "Création de projet",
	update: "Mise à jour du projet",
	delete: "Suppression",
};

export function ProposalCard({ proposal }: { proposal: ProjectProposal }) {
	const [applied, setApplied] = useState(false);
	const [pending, start] = useTransition();

	const apply = () =>
		start(async () => {
			const res = await applyProjectProposal(proposal);
			if (res.ok) {
				setApplied(true);
				toast.success("Proposition appliquée.");
			} else {
				toast.error(res.error);
			}
		});

	return (
		<div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 space-y-2">
			<p className="text-sm font-medium text-zinc-100">
				{LABELS[proposal.action]}
				{proposal.projectId ? ` #${proposal.projectId}` : ""}
			</p>
			<p className="text-sm text-zinc-300">{proposal.summary}</p>
			<ul className="text-xs text-zinc-500 font-mono">
				{summarizeProposal(proposal).map((field) => (
					<li key={field}>{field}</li>
				))}
			</ul>
			<button
				type="button"
				disabled={pending || applied}
				onClick={apply}
				className="text-xs bg-zinc-100 text-zinc-900 rounded px-3 py-1.5 font-medium disabled:opacity-50"
			>
				{applied ? "Appliqué" : pending ? "Application…" : "Appliquer"}
			</button>
		</div>
	);
}
