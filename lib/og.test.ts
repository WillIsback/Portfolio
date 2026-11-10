import { describe, expect, it } from "vitest";
import { ogText } from "./og";

describe("texte des images de partage", () => {
	it("laisse un titre court intact", () => {
		const title = "Syntheo 0.7 : un bloc-notes de réunion";
		expect(title.length).toBeLessThanOrEqual(40);
		expect(ogText({ title, kicker: "Article" })).toEqual({
			title,
			kicker: "Article",
		});
	});

	it("réduit un titre long à 90 caractères, terminé par …, sans couper un mot", () => {
		const words = "parcours ingénieur modèles locaux transcription".split(" ");
		const title = Array.from({ length: 30 }, (_, i) => words[i % words.length])
			.join(" ")
			.slice(0, 120);
		const { title: out } = ogText({ title, kicker: "Article" });
		expect(out.length).toBeLessThanOrEqual(90);
		expect(out.endsWith("…")).toBe(true);
		const kept = out.slice(0, -1).trimEnd();
		expect(title.startsWith(kept)).toBe(true);
		expect(title[kept.length]).toBe(" ");
	});

	it("ne coupe pas un mot unique trop long au milieu sans le signaler", () => {
		const { title } = ogText({ title: "a".repeat(120), kicker: "Portfolio" });
		expect(title.length).toBeLessThanOrEqual(90);
		expect(title.endsWith("…")).toBe(true);
	});
});
