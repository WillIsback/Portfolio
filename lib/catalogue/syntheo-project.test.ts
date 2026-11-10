import { describe, expect, it } from "vitest";
import { PITCH_MAX } from "@/lib/admin/project-form";
import { normalizeDomains } from "@/lib/domains";
import { normalizePractices } from "@/lib/practices";
import { AdminProjectSchema } from "@/schemas";
import { SYNTHEO_PROJECT, SYNTHEO_PROJECT_ID } from "./syntheo-project";

describe("SYNTHEO_PROJECT", () => {
	it("cible la fiche 20", () => {
		expect(SYNTHEO_PROJECT_ID).toBe(20);
	});

	it("passe le schéma de l'admin sans être modifiée", () => {
		expect(AdminProjectSchema.parse(SYNTHEO_PROJECT)).toEqual(SYNTHEO_PROJECT);
	});

	it("tient dans la limite d'accroche de l'admin", () => {
		expect(SYNTHEO_PROJECT.pitch?.length ?? 0).toBeLessThanOrEqual(PITCH_MAX);
	});

	it("a des domaines et des pratiques déjà normalisés", () => {
		expect(SYNTHEO_PROJECT.domains).toEqual(
			normalizeDomains(SYNTHEO_PROJECT.domains),
		);
		expect(SYNTHEO_PROJECT.practices).toEqual(
			normalizePractices(SYNTHEO_PROJECT.practices),
		);
	});

	it("ne garde rien de l'ancienne génération web", () => {
		expect(SYNTHEO_PROJECT.frontends).not.toContain("NextJs");
		expect(SYNTHEO_PROJECT.databases).not.toContain("Postgresql");
		expect(SYNTHEO_PROJECT.description).not.toMatch(/visio-meeting/i);
	});
});
