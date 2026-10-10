import { domainLabels } from "../domains";
import { extractTerms } from "./terms";
import { foldText } from "./tokenize";

export interface CorpusItem {
	id: string;
	kind: "article" | "project";
	title: string;
	text: string;
	href: string;
	keywords: string[];
	terms: string[];
}

export interface ProjectForCorpus {
	id: number;
	title: string;
	description: string;
	github: string | null;
	isPrivate: boolean;
	languages: { language: string }[];
	databases: { database: string }[];
	backends: { backend: string }[];
	frontends: { frontend: string }[];
	devops: { devops: string }[];
	mlStack: { ml: string }[];
	domains: { domain: string }[];
}

export function normalizeKeyword(value: string): string {
	return foldText(value).trim().replace(/\s+/g, " ");
}

function joinSentences(parts: string[]): string {
	return parts
		.map((part) => part.trim().replace(/\.$/, ""))
		.filter((part) => part.length > 0)
		.join(". ");
}

export function articleToCorpusItem(article: {
	slug: string;
	title: string;
	description: string;
	tags: string[];
}): CorpusItem {
	return {
		id: `article:${article.slug}`,
		kind: "article",
		title: article.title,
		text: joinSentences([
			article.title,
			article.description,
			article.tags.join(", "),
		]),
		href: `/articles/${article.slug}`,
		keywords: article.tags.map(normalizeKeyword),
		terms: extractTerms(article.title, article.description),
	};
}

export function projectToCorpusItem(
	project: ProjectForCorpus,
): CorpusItem | null {
	if (project.isPrivate || !project.github) return null;
	const tech = [
		...project.languages.map((l) => l.language),
		...project.databases.map((d) => d.database),
		...project.backends.map((b) => b.backend),
		...project.frontends.map((f) => f.frontend),
		...project.devops.map((d) => d.devops),
	];
	return {
		id: `project:${project.id}`,
		kind: "project",
		title: project.title,
		text: joinSentences([project.title, project.description, tech.join(", ")]),
		href: project.github,
		keywords: [
			...tech,
			...project.mlStack.map((m) => m.ml),
			...domainLabels(project.domains),
		].map(normalizeKeyword),
		terms: extractTerms(project.title, project.description),
	};
}
