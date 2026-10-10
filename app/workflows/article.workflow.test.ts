import { describe, expect, it } from "vitest";
import { assembleArticle, buildSections, planSchema } from "./article.workflow";

describe("shared logic", () => {
	it("planSchema valide un plan", () => {
		expect(
			planSchema.parse({
				sections: [{ heading: "Intro", brief: "Poser le sujet" }],
			}).sections[0].heading,
		).toBe("Intro");
	});
	it("buildSections découpe par section", () => {
		expect(
			buildSections([
				{ heading: "A", brief: "x" },
				{ heading: "B", brief: "y" },
			]),
		).toEqual(["A", "B"]);
	});

	it("planSchema borne le nombre de sections", () => {
		expect(planSchema.safeParse({ sections: [] }).success).toBe(false);
		expect(
			planSchema.safeParse({
				sections: Array.from({ length: 9 }, (_, i) => ({
					heading: String(i),
					brief: "b",
				})),
			}).success,
		).toBe(false);
		expect(
			planSchema.safeParse({
				sections: Array.from({ length: 8 }, (_, i) => ({
					heading: String(i),
					brief: "b",
				})),
			}).success,
		).toBe(true);
	});

	it("assembleArticle assemble les sections en MDX", async () => {
		const draft = await assembleArticle({
			brief: {
				slug: "a",
				title: "A",
				description: "d",
				tags: ["x"],
				notes: "n",
			},
			sections: [{ heading: "Intro", body: "Texte." }],
		});
		expect(draft.body).toContain("## Intro");
		expect(draft.body).toContain("Texte.");
		expect(draft.status).toBe("brouillon");
	});
});
