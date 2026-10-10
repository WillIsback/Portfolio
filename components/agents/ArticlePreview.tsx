"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { openArticlePr } from "@/app/actions/agents.action";
import { type ArticleDraft, frontmatterToMdx } from "@/lib/agents/articles";

export function ArticlePreview({ draft }: { draft: ArticleDraft }) {
	const [url, setUrl] = useState<string | null>(null);
	const [pending, start] = useTransition();

	const openPr = () =>
		start(async () => {
			const res = await openArticlePr({
				slug: draft.slug,
				mdx: frontmatterToMdx(draft),
				title: draft.title,
				body: draft.description,
			});
			if (res.ok) {
				setUrl(res.url);
				toast.success("PR ouverte.");
			} else {
				toast.error(res.error);
			}
		});

	return (
		<div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 space-y-3">
			<p className="font-mono text-xs text-zinc-500">
				content/articles/{draft.slug}.mdx
			</p>
			<h2 className="text-lg font-bold text-zinc-100">{draft.title}</h2>
			<p className="text-sm text-zinc-400">{draft.description}</p>
			<pre className="max-h-80 overflow-auto rounded bg-zinc-950 p-3 text-xs text-zinc-300 whitespace-pre-wrap">
				{draft.body}
			</pre>
			{url ? (
				<a
					href={url}
					target="_blank"
					rel="noreferrer"
					className="text-sm text-emerald-400 hover:underline"
				>
					Voir la PR
				</a>
			) : (
				<button
					type="button"
					disabled={pending}
					onClick={openPr}
					className="text-sm bg-zinc-100 text-zinc-900 rounded-lg px-4 py-2 font-medium disabled:opacity-50"
				>
					{pending ? "Ouverture…" : "Ouvrir la PR"}
				</button>
			)}
		</div>
	);
}
