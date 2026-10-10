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
		let timer: ReturnType<typeof setInterval> | undefined;
		const stop = () => {
			if (timer) clearInterval(timer);
		};
		const tick = async () => {
			const res = await getArticleRun(runId);
			if (cancelled) return;
			if (!res.ok) {
				setError(res.error);
				stop();
				return;
			}
			setStatus(res.status);
			if (res.draft) {
				setDraft(res.draft);
				stop();
			}
		};
		void tick();
		timer = setInterval(tick, 4000);
		return () => {
			cancelled = true;
			stop();
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
