import { describe, expect, it } from "vitest";
import { AdminProjectSchema, ProjectFiltersSchema } from "@/schemas";

const base = { title: "t", description: "d" };

describe("AdminProjectSchema — pratiques et formation", () => {
	it("défauts, doublons et valeurs inconnues", () => {
		const ok = AdminProjectSchema.parse(base);
		expect(ok.practices).toEqual([]);
		expect(ok.training).toBeNull();
		expect(
			AdminProjectSchema.parse({
				...base,
				practices: ["Hardening", "Hardening"],
			}).practices,
		).toEqual(["Hardening"]);
		expect(
			AdminProjectSchema.safeParse({ ...base, practices: ["Foo"] }).success,
		).toBe(false);
		expect(
			AdminProjectSchema.safeParse({ ...base, training: "Bac" }).success,
		).toBe(false);
		expect(
			AdminProjectSchema.parse({ ...base, training: "AIEngineer" }).training,
		).toBe("AIEngineer");
	});

	it("filtres : famille et formation", () => {
		expect(
			ProjectFiltersSchema.parse({ practice: ["MLOps"], training: "only" }),
		).toMatchObject({
			practice: ["MLOps"],
			training: "only",
		});
		expect(ProjectFiltersSchema.safeParse({ training: "maybe" }).success).toBe(
			false,
		);
	});
});
