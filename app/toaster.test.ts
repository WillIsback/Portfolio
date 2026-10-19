import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) =>
	readFileSync(path.join(process.cwd(), file), "utf8");

/**
 * Les deux root layouts qui remplacent `app/layout.tsx` : le public
 * (`app/[locale]/`) et celui de l'espace admin (`app/(admin)/`). Le toaster ne
 * doit être monté dans aucun des deux, sinon il s'affiche sur toutes les pages.
 */
const ROOT_LAYOUTS = ["app/[locale]/layout.tsx", "app/(admin)/layout.tsx"];

describe("ThemedToaster", () => {
	it("n'est plus chargé par toutes les pages (layouts racine)", () => {
		for (const layout of ROOT_LAYOUTS) {
			expect(read(layout)).not.toContain("ThemedToaster");
		}
	});

	it("est monté là où des toasts sont émis", () => {
		// La fiche contact émet ses toasts depuis son formulaire client, la coquille
		// serveur `Contact/page.tsx` n'en émet aucun.
		expect(read("app/[locale]/Contact/ContactForm.tsx")).toContain(
			"<ThemedToaster />",
		);
		expect(read("app/(admin)/admin/(app)/layout.tsx")).toContain(
			"<ThemedToaster />",
		);
	});
});
