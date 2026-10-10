import { describe, expect, it } from "vitest";
import { buildSections, planSchema } from "./article.workflow";

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
});
