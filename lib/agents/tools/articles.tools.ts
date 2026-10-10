import { tool } from "ai";
import { z } from "zod";
import { getAllArticles, getArticleBySlug } from "@/lib/articles/loader";

export const articleTools = {
	listArticles: tool({
		description: "Liste les articles (métadonnées : slug, titre, tags, date).",
		inputSchema: z.object({}),
		execute: async () =>
			getAllArticles().map((a) => ({
				slug: a.slug,
				title: a.title,
				description: a.description,
				date: a.date,
				tags: a.tags,
				projects: a.projects ?? [],
			})),
	}),
	getArticle: tool({
		description:
			"Contenu complet (frontmatter + corps MDX) d'un article par slug.",
		inputSchema: z.object({ slug: z.string() }),
		execute: async ({ slug }) => getArticleBySlug(slug),
	}),
};
