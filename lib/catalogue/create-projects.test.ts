import { describe, expect, it } from "vitest";
import type { AdminProject } from "@/schemas";
import { pendingCreations } from "./create-projects";

const fiche = (title: string, githubRepoId?: number): AdminProject => ({
	title,
	description: "d",
	isPrivate: false,
	isAiGenerated: false,
	languages: [],
	databases: [],
	backends: [],
	frontends: [],
	devops: [],
	domains: [],
	mlStack: [],
	practices: [],
	training: null,
	...(githubRepoId === undefined ? {} : { githubRepoId }),
});

const db = (existing: Record<number, string>) => ({
	project: {
		findUnique: async ({ where }: { where: { githubRepoId: number } }) =>
			existing[where.githubRepoId]
				? { id: 1, title: existing[where.githubRepoId] }
				: null,
	},
});

describe("pendingCreations", () => {
	it("ne garde que les dépôts sans fiche", async () => {
		const pending = await pendingCreations(
			db({ 10: "déjà là" }),
			[fiche("a", 10), fiche("b", 11)],
			() => {},
		);
		expect(pending.map((p) => p.title)).toEqual(["b"]);
	});

	it("refuse une fiche sans githubRepoId", async () => {
		await expect(
			pendingCreations(db({}), [fiche("sans id")], () => {}),
		).rejects.toThrow("githubRepoId manquant");
	});
});
