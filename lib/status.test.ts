import { describe, expect, it } from "vitest";
import { frTranslator } from "@/i18n/fr";
import fr from "@/messages/fr.json";
import { PROJECT_STATUSES, statusLabels } from "./status";

describe("statuts de projet", () => {
	const labels = statusLabels(frTranslator("status"));

	it("expose les trois statuts dans l'ordre", () => {
		expect(PROJECT_STATUSES).toEqual(["InProgress", "Done", "Archived"]);
	});

	it("donne un libellé français à chaque statut", () => {
		expect(PROJECT_STATUSES.map((s) => labels[s])).toEqual([
			fr.status.InProgress,
			fr.status.Done,
			fr.status.Archived,
		]);
	});

	it("couvre chaque statut, sans libellé vide", () => {
		expect(Object.keys(labels).sort()).toEqual([...PROJECT_STATUSES].sort());
		for (const status of PROJECT_STATUSES)
			expect(labels[status].trim().length).toBeGreaterThan(0);
	});
});
