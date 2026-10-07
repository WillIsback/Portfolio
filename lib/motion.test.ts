import { describe, expect, it } from "vitest";
import { inkDrawAnimation, noteAnimation } from "./motion";

describe("animations du carnet", () => {
	it("tracent l'encre et décalent la note seulement si le mouvement est permis", () => {
		expect(inkDrawAnimation(false)).toEqual({ pathLength: [0, 1] });
		expect(noteAnimation(false)).toEqual({ y: [4, 0] });
	});

	it("ne bougent pas en mouvement réduit ni au rendu serveur (null)", () => {
		expect(inkDrawAnimation(true)).toBeUndefined();
		expect(inkDrawAnimation(null)).toBeUndefined();
		expect(noteAnimation(true)).toBeUndefined();
		expect(noteAnimation(null)).toBeUndefined();
	});
});
