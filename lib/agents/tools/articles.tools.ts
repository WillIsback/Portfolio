import { tool } from "ai";
import { z } from "zod";
import { getAllArticles, getArticleBySlug } from "@/lib/articles/loader";
import prisma from "@/lib/db";

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
	checkProjectLinks: tool({
		description:
			"Vérifie la cohérence des liens projets d'un article (ids absents de la base).",
		inputSchema: z.object({ slug: z.string() }),
		execute: async ({ slug }) => {
			const article = getArticleBySlug(slug);
			if (!article) return null;
			const ids = article.projects ?? [];
			const rows = await prisma.project.findMany({
				where: { id: { in: ids } },
				select: { id: true, title: true },
			});
			const found = new Set(rows.map((r) => r.id));
			return {
				linked: rows,
				missing: ids.filter((id) => !found.has(id)),
			};
		},
	}),
	listTags: tool({
		description: "Liste triée des tags distincts présents dans les articles.",
		inputSchema: z.object({}),
		execute: async () =>
			[...new Set(getAllArticles().flatMap((a) => a.tags))].sort(),
	}),
};
