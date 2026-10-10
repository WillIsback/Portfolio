import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getArticleRun } from "@/app/actions/agents.action";
import { mdxComponents } from "@/components/articles/mdx";

import "@/app/articles/articles.css";

export default async function ArticlePreviewPage({
	params,
}: {
	params: Promise<{ runId: string }>;
}) {
	const { runId } = await params;
	const res = await getArticleRun(runId);
	if (!res.ok || !res.draft) notFound();

	const { content } = await compileMDX({
		source: res.draft.body,
		components: mdxComponents,
		options: {
			blockJS: false,
			blockDangerousJS: true,
			mdxOptions: { remarkPlugins: [remarkGfm] },
		},
	});

	return (
		<div className="dark">
			<div className="articles-scope mx-auto max-w-3xl">
				<Link
					href="/admin/agents/articles"
					className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
				>
					← Agent Articles
				</Link>
				<h1 className="mt-4 mb-6 font-display text-2xl font-bold text-foreground">
					{res.draft.title}
				</h1>
				<article className="article-prose">{content}</article>
			</div>
		</div>
	);
}
