"use client";

import { useEffect, useState } from "react";
import { getArticleRun } from "@/app/actions/agents.action";
import type { ArticleDraft } from "@/lib/agents/articles";
import { ArticlePreview } from "./ArticlePreview";

export function ArticleDraftTool({ runId }: { runId: string }) {
	const [draft, setDraft] = useState<ArticleDraft | null>(null);
	const [status, setStatus] = useState("running");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let stop = false;
		const tick = async () => {
			const res = await getArticleRun(runId);
			if (stop) return;
			if (!res.ok) {
				setError(res.error);
				return;
			}
			setStatus(res.status);
			if (res.draft) setDraft(res.draft);
		};
		void tick();
		const id = setInterval(() => {
			if (draft) return;
			void tick();
		}, 4000);
		return () => {
			stop = true;
			clearInterval(id);
		};
	}, [runId, draft]);

	if (error) return <p className="text-sm text-red-400">{error}</p>;
	if (!draft)
		return (
			<p className="text-sm text-zinc-500">
				Génération en cours… (statut : {status})
			</p>
		);
	return <ArticlePreview draft={draft} />;
}
