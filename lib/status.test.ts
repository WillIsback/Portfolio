import { describe, expect, it } from "vitest";
import { PROJECT_STATUSES, STATUS_LABELS } from "./status";

describe("statuts de projet", () => {
	it("expose les trois statuts dans l'ordre", () => {
		expect(PROJECT_STATUSES).toEqual(["InProgress", "Done", "Archived"]);
	});

	it("donne un libellé français à chaque statut", () => {
		expect(PROJECT_STATUSES.map((s) => STATUS_LABELS[s])).toEqual([
			"en cours",
			"terminé",
			"archivé",
		]);
	});
});
