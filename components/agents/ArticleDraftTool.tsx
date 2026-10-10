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
		let cancelled = false;
		let done = false;
		const tick = async () => {
			if (done) return;
			const res = await getArticleRun(runId);
			if (cancelled) return;
			if (!res.ok) {
				setError(res.error);
				done = true;
				return;
			}
			setStatus(res.status);
			if (res.draft) {
				setDraft(res.draft);
				done = true;
			}
		};
		void tick();
		const timer = setInterval(tick, 4000);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, [runId]);

	if (error) return <p className="text-sm text-red-400">{error}</p>;
	if (!draft)
		return (
			<p className="text-sm text-zinc-500">
				Génération en cours… (statut : {status})
			</p>
		);
	return <ArticlePreview draft={draft} />;
}
