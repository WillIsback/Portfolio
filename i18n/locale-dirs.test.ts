import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	articlesDir,
	listArticleSlugs,
	readArticle,
} from "@/lib/articles/loader";

const root = process.cwd();

describe("répertoires d'articles par locale", () => {
	it("résout le dossier français à la racine", () => {
		expect(articlesDir("fr")).toBe(path.join(root, "content", "articles"));
	});

	it("liste les slugs français", () => {
		expect(listArticleSlugs("fr")).toContain("neuf-agents-neuf-jours");
	});

	it("retombe sur le français quand la locale n'a pas de dossier", () => {
		expect(articlesDir("zh")).toBe(path.join(root, "content", "articles"));
	});

	it("signale qu'un article n'est pas traduit dans la locale demandée", () => {
		const result = readArticle("neuf-agents-neuf-jours", "en");
		expect(result.fallback).toBe(true);
		expect(result.article).not.toBeNull();
	});

	it("ne signale pas de repli pour le français", () => {
		expect(readArticle("neuf-agents-neuf-jours", "fr").fallback).toBe(false);
	});

	it("lit une traduction quand elle existe", () => {
		if (!fs.existsSync(path.join(root, "content", "articles", "en"))) return;
		expect(readArticle("neuf-agents-neuf-jours", "en").fallback).toBe(false);
	});
});
