import { getArticleBySlug, getArticleSlugs } from "../../lib/articles/loader";
import {
	articleToCorpusItem,
	type CorpusItem,
	projectToCorpusItem,
} from "../../lib/carnet/corpus";
import { prisma } from "../../lib/db";

export async function loadCorpus(): Promise<CorpusItem[]> {
	if (!process.env.DATABASE_URL) {
		throw new Error(
			"DATABASE_URL manquante : lancer via `tsx --env-file=.env.local`.",
		);
	}
	const articles = getArticleSlugs()
		.map((slug) => getArticleBySlug(slug))
		.filter(
			(article): article is NonNullable<typeof article> => article !== null,
		)
		.map((article) =>
			articleToCorpusItem({
				slug: article.slug,
				title: article.title,
				description: article.description,
				tags: article.tags,
			}),
		);
	const projects = await prisma.project.findMany({
		select: {
			id: true,
			title: true,
			description: true,
			github: true,
			isPrivate: true,
			languages: { select: { language: true } },
			databases: { select: { database: true } },
			backends: { select: { backend: true } },
			frontends: { select: { frontend: true } },
			devops: { select: { devops: true } },
			domains: { select: { domain: true } },
		},
		orderBy: { id: "asc" },
	});
	await prisma.$disconnect();
	const projectItems = projects
		.map(projectToCorpusItem)
		.filter((item): item is CorpusItem => item !== null);
	return [...articles, ...projectItems];
}
