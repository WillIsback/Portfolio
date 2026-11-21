import { describe, expect, it } from "vitest";
import { PITCH_MAX } from "@/lib/admin/project-form";
import { normalizeDomains } from "@/lib/domains";
import { normalizePractices } from "@/lib/practices";
import { AdminProjectSchema } from "@/schemas";
import { GRAMMARIA_PROJECTS } from "./grammaria-projects";

describe("GRAMMARIA_PROJECTS", () => {
	it.each(
		GRAMMARIA_PROJECTS.map((p) => [p.title, p]),
	)("%s passe le schéma de l'admin sans être modifiée", (_, project) => {
		expect(AdminProjectSchema.parse(project)).toEqual(project);
	});

	it.each(
		GRAMMARIA_PROJECTS.map((p) => [p.title, p]),
	)("%s : accroche courte, domaines et pratiques normalisés", (_, project) => {
		expect(project.pitch?.length ?? 0).toBeLessThanOrEqual(PITCH_MAX);
		expect(project.domains).toEqual(normalizeDomains(project.domains));
		expect(project.practices).toEqual(normalizePractices(project.practices));
	});

	it("pointe chaque fiche vers son propre dépôt", () => {
		for (const p of GRAMMARIA_PROJECTS) {
			expect(p.github).toBe(`https://github.com/WillIsback/${p.title}`);
			expect(typeof p.githubRepoId).toBe("number");
		}
	});
});
