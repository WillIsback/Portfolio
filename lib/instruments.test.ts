import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { frTranslator } from "@/i18n/fr";
import { INSTRUMENTS, instrumentTitle } from "./instruments";

describe("INSTRUMENTS", () => {
	it("suit l'ordre de la spec : Data & ML, back-end, front-end, DevOps", () => {
		expect(INSTRUMENTS.map((i) => i.id)).toEqual([
			"data-ml",
			"backend",
			"frontend",
			"devops",
		]);
	});

	it("ne référence que des logos présents dans public/", () => {
		for (const i of INSTRUMENTS)
			for (const t of i.tools)
				if (t.icon)
					expect(existsSync(path.join(process.cwd(), "public", t.icon))).toBe(
						true,
					);
	});

	it("met les bibliothèques de ML dans la ligne Data & ML", () => {
		expect(INSTRUMENTS[0].libraries).toEqual(
			expect.arrayContaining(["PyTorch", "Transformers", "Scikit-learn"]),
		);
		expect(INSTRUMENTS[1].libraries).not.toContain("PyTorch");
	});

	it("tient un titre traduit pour chaque ligne, et lui seul", () => {
		const t = frTranslator("instruments");
		for (const instrument of INSTRUMENTS)
			expect(instrumentTitle(t, instrument.id).trim().length).toBeGreaterThan(
				0,
			);
		// Les noms d'outils sont des marques : ils restent dans `INSTRUMENTS`, pas au
		// dictionnaire, et le composant ne les traduit pas.
		expect(instrumentTitle(t, "data-ml")).toBe("Data & ML");
		expect(INSTRUMENTS[0].tools.map((tool) => tool.name)).toContain("Python");
	});
});
