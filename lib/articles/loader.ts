import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

export interface ArticleFrontmatter {
	title: string;
	description: string;
	/** ISO date, YYYY-MM-DD */
	date: string;
	period?: string;
	tags: string[];
	status?: string;
	projects?: number[];
}

export interface ArticleMeta extends ArticleFrontmatter {
	slug: string;
	readingTimeMinutes: number;
}

export interface Article extends ArticleMeta {
	/** MDX body without the frontmatter block */
	content: string;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Average silent reading speed for French prose. */
const WORDS_PER_MINUTE = 220;

function toIsoDate(value: unknown, file: string): string {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value.toISOString().slice(0, 10);
	}
	if (typeof value === "string" && DATE_RE.test(value)) return value;
	throw new Error(`${file}: frontmatter "date" must be YYYY-MM-DD`);
}

function requireString(
	data: Record<string, unknown>,
	key: string,
	file: string,
): string {
	const value = data[key];
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error(`${file}: frontmatter "${key}" is required`);
	}
	return value;
}

function optionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function optionalProjectIds(
	value: unknown,
	file: string,
): number[] | undefined {
	if (value === undefined) return undefined;
	if (
		!Array.isArray(value) ||
		!value.every((v) => Number.isInteger(v) && (v as number) > 0)
	) {
		throw new Error(
			`${file}: "projects" doit être une liste d'entiers positifs`,
		);
	}
	return value as number[];
}

export function parseFrontmatter(
	data: Record<string, unknown>,
	file = "article",
): ArticleFrontmatter {
	const tags = data.tags ?? [];
	if (!Array.isArray(tags) || tags.some((t) => typeof t !== "string")) {
		throw new Error(`${file}: frontmatter "tags" must be a string[]`);
	}
	return {
		title: requireString(data, "title", file),
		description: requireString(data, "description", file),
		date: toIsoDate(data.date, file),
		period: optionalString(data.period),
		tags: tags as string[],
		status: optionalString(data.status),
		projects: optionalProjectIds(data.projects, file),
	};
}

/**
 * Estimated reading time in whole minutes (min. 1). Counts words in prose and
 * in string props of MDX components (they are read too), ignoring markup.
 */
export function readingTime(content: string, wpm = WORDS_PER_MINUTE): number {
	const words = content.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? [];
	return Math.max(1, Math.round(words.length / wpm));
}

export function parseArticle(slug: string, raw: string): Article {
	const { data, content } = matter(raw);
	const frontmatter = parseFrontmatter(data, `${slug}.mdx`);
	return {
		...frontmatter,
		slug,
		content,
		readingTimeMinutes: readingTime(content),
	};
}

export function getArticleSlugs(dir = ARTICLES_DIR): string[] {
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir)
		.filter((file) => file.endsWith(".mdx"))
		.map((file) => file.slice(0, -".mdx".length))
		.filter((slug) => SLUG_RE.test(slug))
		.sort();
}

export function getArticleBySlug(
	slug: string,
	dir = ARTICLES_DIR,
): Article | null {
	if (!SLUG_RE.test(slug)) return null;
	const file = path.join(dir, `${slug}.mdx`);
	if (!fs.existsSync(file)) return null;
	return parseArticle(slug, fs.readFileSync(file, "utf8"));
}

/** All articles, newest first (ties broken by title). */
export function getAllArticles(dir = ARTICLES_DIR): ArticleMeta[] {
	return getArticleSlugs(dir)
		.map((slug) => getArticleBySlug(slug, dir))
		.filter((a): a is Article => a !== null)
		.map((article): ArticleMeta => {
			const { content, ...meta } = article;
			void content;
			return meta;
		})
		.sort(
			(a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title),
		);
}

export function latestArticles(n: number, dir = ARTICLES_DIR): ArticleMeta[] {
	return [...getAllArticles(dir)]
		.sort((a, b) => b.date.localeCompare(a.date))
		.slice(0, Math.max(0, n));
}

export function projectEntries(
	articles: ArticleMeta[],
): Record<number, { slug: string; title: string }> {
	const out: Record<number, { slug: string; title: string }> = {};
	const byDate = [...articles].sort((a, b) => b.date.localeCompare(a.date));
	for (const article of byDate)
		for (const id of article.projects ?? [])
			out[id] ??= { slug: article.slug, title: article.title };
	return out;
}
