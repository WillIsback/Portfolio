import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
	default: { project: { findMany: vi.fn(async () => []) } },
}));

import { articleTools } from "./articles.tools";

describe("articleTools", () => {
	it("listArticles renvoie des métadonnées", async () => {
		const out = (await articleTools.listArticles.execute?.(
			{},
			{} as never,
		)) as unknown[];
		expect(Array.isArray(out)).toBe(true);
		expect(out.length).toBeGreaterThan(0);
		const first = out[0] as { slug: string; title: string; tags: string[] };
		expect(typeof first.slug).toBe("string");
		expect(Array.isArray(first.tags)).toBe(true);
	});

	it("getArticle renvoie null pour un slug inconnu", async () => {
		const out = await articleTools.getArticle.execute?.(
			{ slug: "inexistant-xyz" },
			{} as never,
		);
		expect(out).toBeNull();
	});

	it("listTags renvoie un tableau trié non vide du corpus réel", async () => {
		const out = (await articleTools.listTags.execute?.(
			{},
			{} as never,
		)) as string[];
		expect(Array.isArray(out)).toBe(true);
		expect(out.length).toBeGreaterThan(0);
		expect([...out]).toEqual([...out].sort());
	});

	it("checkProjectLinks renvoie null pour un slug inconnu", async () => {
		const out = await articleTools.checkProjectLinks.execute?.(
			{ slug: "inexistant-xyz" },
			{} as never,
		);
		expect(out).toBeNull();
	});

	it("checkProjectLinks utilise le corpus réel et renvoie la forme attendue", async () => {
		const meta = (await articleTools.listArticles.execute?.(
			{},
			{} as never,
		)) as { slug: string }[];
		const slug = meta[0].slug;
		const out = (await articleTools.checkProjectLinks.execute?.(
			{ slug },
			{} as never,
		)) as { linked: { id: number; title: string }[]; missing: number[] };
		expect(out).toEqual({ linked: [], missing: [] });
		expect(Array.isArray(out.linked)).toBe(true);
		expect(Array.isArray(out.missing)).toBe(true);
	});
});
