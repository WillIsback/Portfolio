import { describe, expect, it } from "vitest";
import { PITCH_MAX } from "@/lib/admin/project-form";
import { normalizeDomains } from "@/lib/domains";
import { normalizePractices } from "@/lib/practices";
import { AdminProjectSchema } from "@/schemas";
import { NEW_OC_PROJECTS, OC_TITLE_RENAMES } from "./oc-naming";

const CONVENTION = /^OC-(DIA|AIE)-P\d+-[A-Za-z0-9-]+$/;

describe("OC_TITLE_RENAMES", () => {
	it("donne à chaque fiche un titre conforme à la convention", () => {
		for (const { to } of Object.values(OC_TITLE_RENAMES)) {
			expect(to).toMatch(CONVENTION);
		}
	});

	it("change réellement chaque titre", () => {
		for (const { from, to } of Object.values(OC_TITLE_RENAMES)) {
			expect(from).not.toBe(to);
		}
	});
});

describe("NEW_OC_PROJECTS", () => {
	it("compte les huit dépôts OC absents du portfolio", () => {
		expect(NEW_OC_PROJECTS).toHaveLength(8);
	});

	it.each(
		NEW_OC_PROJECTS.map((p) => [p.title, p]),
	)("%s passe le schéma de l'admin sans être modifiée", (_, project) => {
		expect(AdminProjectSchema.parse(project)).toEqual(project);
	});

	it.each(
		NEW_OC_PROJECTS.map((p) => [p.title, p]),
	)("%s : titre = nom du dépôt, conforme à la convention", (_, project) => {
		expect(project.title).toMatch(CONVENTION);
		expect(project.github).toBe(
			`https://github.com/WillIsback/${project.title}`,
		);
	});

	it.each(
		NEW_OC_PROJECTS.map((p) => [p.title, p]),
	)("%s : parcours cohérent avec le préfixe", (_, project) => {
		const expected = project.title.startsWith("OC-AIE-")
			? "AIEngineer"
			: "FullstackAI";
		expect(project.training).toBe(expected);
	});

	it.each(
		NEW_OC_PROJECTS.map((p) => [p.title, p]),
	)("%s : accroche courte, domaines et pratiques normalisés", (_, project) => {
		expect(project.pitch?.length ?? 0).toBeLessThanOrEqual(PITCH_MAX);
		expect(project.domains).toEqual(normalizeDomains(project.domains));
		expect(project.practices).toEqual(normalizePractices(project.practices));
	});

	it("n'a pas deux fiches pour le même dépôt", () => {
		const ids = NEW_OC_PROJECTS.map((p) => p.githubRepoId);
		expect(ids.every((id) => typeof id === "number")).toBe(true);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
