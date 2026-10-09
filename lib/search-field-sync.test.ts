import { describe, expect, it } from "vitest";
import { nextSearchField } from "./search-field-sync";

describe("nextSearchField", () => {
	it("ne change rien tant que l'URL ne bouge pas", () => {
		expect(
			nextSearchField({
				urlSearch: "a",
				prevUrlSearch: "a",
				pushed: [],
				field: "ab",
			}),
		).toEqual({ field: "ab", pushed: [], cancelPending: false });
	});

	it("ignore l'écho de notre propre poussée et le consomme", () => {
		expect(
			nextSearchField({
				urlSearch: "abc",
				prevUrlSearch: "",
				pushed: ["abc"],
				field: "abc",
			}),
		).toEqual({ field: "abc", pushed: [], cancelPending: false });
	});

	it("préserve la saisie faite après la poussée et garde la mise à jour en attente", () => {
		expect(
			nextSearchField({
				urlSearch: "py",
				prevUrlSearch: "",
				pushed: ["py"],
				field: "pyth",
			}),
		).toEqual({ field: "pyth", pushed: [], cancelPending: false });
	});

	it("un retour puis une avance vers la même valeur re-synchronisent le champ", () => {
		const back = nextSearchField({
			urlSearch: "",
			prevUrlSearch: "abc",
			pushed: [],
			field: "abc",
		});
		expect(back).toEqual({ field: "", pushed: [], cancelPending: true });
		const forward = nextSearchField({
			urlSearch: "abc",
			prevUrlSearch: "",
			pushed: back.pushed,
			field: back.field,
		});
		expect(forward.field).toBe("abc");
	});

	it("un changement externe annule la mise à jour différée", () => {
		expect(
			nextSearchField({
				urlSearch: "x",
				prevUrlSearch: "y",
				pushed: ["z"],
				field: "z",
			}),
		).toEqual({ field: "x", pushed: [], cancelPending: true });
	});

	it("consomme aussi les poussées antérieures quand l'écho arrive en retard", () => {
		expect(
			nextSearchField({
				urlSearch: "p",
				prevUrlSearch: "",
				pushed: ["p", "py"],
				field: "py",
			}),
		).toEqual({ field: "py", pushed: ["py"], cancelPending: false });
	});
});
