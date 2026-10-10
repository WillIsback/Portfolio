import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ProposalCard } from "./ProposalCard";

vi.mock("sonner", () => ({ toast: { success() {}, error() {} } }));
vi.mock("@/app/actions/agents.action", () => ({
	applyProjectProposal: vi.fn(),
}));

describe("ProposalCard", () => {
	it("affiche l'action, le résumé et les champs, avec un bouton Appliquer", () => {
		const html = renderToStaticMarkup(
			<ProposalCard
				proposal={{
					action: "update",
					projectId: 3,
					summary: "Ajouter le domaine Agents",
					data: { domains: ["Agents"], pitch: "Neuf." },
				}}
			/>,
		);
		expect(html).toContain("Mise à jour du projet");
		expect(html).toContain("Ajouter le domaine Agents");
		expect(html).toContain("domains");
		expect(html).toContain("Appliquer");
	});
	it("affiche la suppression", () => {
		const html = renderToStaticMarkup(
			<ProposalCard
				proposal={{ action: "delete", projectId: 7, summary: "Doublon" }}
			/>,
		);
		expect(html).toContain("Suppression");
		expect(html).toContain("#7");
	});
});
