import { describe, expect, it } from "vitest";
import { ProjectProposalSchema, summarizeProposal } from "./proposals";

describe("ProjectProposalSchema", () => {
	it("accepte une mise à jour", () => {
		const p = ProjectProposalSchema.parse({
			action: "update",
			projectId: 3,
			summary: "Ajouter le domaine Agents",
			data: { domains: ["Agents"] },
		});
		expect(p.projectId).toBe(3);
	});
	it("refuse une mise à jour sans projectId", () => {
		const r = ProjectProposalSchema.safeParse({
			action: "update",
			summary: "x",
			data: {},
		});
		expect(r.success).toBe(false);
	});
});

describe("summarizeProposal", () => {
	it("liste les champs fournis", () => {
		expect(
			summarizeProposal({
				action: "update",
				projectId: 3,
				summary: "s",
				data: { domains: ["Agents"], pitch: "Neuf." },
			}),
		).toEqual(["domains", "pitch"]);
	});
});
