import { describe, expect, it } from "vitest";
import { buildProjectWhere } from "./projects-filters";

describe("buildProjectWhere", () => {
	it("famille → pratiques de la famille", () => {
		expect(buildProjectWhere({ practice: ["SecOps"] }).practices).toEqual({
			some: {
				practice: {
					in: [
						"DependencyUpdates",
						"StaticAnalysis",
						"SecretsManagement",
						"Hardening",
					],
				},
			},
		});
	});

	it("formation : only / exclude", () => {
		expect(buildProjectWhere({ training: "only" }).training).toEqual({
			not: null,
		});
		expect(buildProjectWhere({ training: "exclude" }).training).toBeNull();
		expect("training" in buildProjectWhere({})).toBe(false);
	});

	it("garde les filtres existants", () => {
		expect(buildProjectWhere({ domain: ["LLM"] }).domains).toEqual({
			some: { domain: { in: ["LLM"] } },
		});
	});
});
