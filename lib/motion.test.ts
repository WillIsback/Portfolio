import { describe, expect, it } from "vitest";
import { inkDrawAnimation } from "./motion";

describe("animations du carnet", () => {
	it("tracent l'encre seulement si le mouvement est permis", () => {
		expect(inkDrawAnimation(false)).toEqual({ pathLength: [0, 1] });
	});

	it("ne bougent pas en mouvement réduit ni au rendu serveur (null)", () => {
		expect(inkDrawAnimation(true)).toBeUndefined();
		expect(inkDrawAnimation(null)).toBeUndefined();
	});
});
