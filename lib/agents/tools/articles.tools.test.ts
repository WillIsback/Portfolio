import { describe, expect, it } from "vitest";
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
});
