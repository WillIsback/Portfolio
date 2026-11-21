import { describe, expect, it } from "vitest";
import { NAV_TARGETS } from "./NavMenu";

const active = (pathname: string) =>
	NAV_TARGETS.filter((t) => t.isActive(pathname)).map((t) => t.key);

describe("NavMenu", () => {
	it("place Solutions entre Articles et À propos", () => {
		expect(NAV_TARGETS.map((t) => t.key)).toEqual([
			"home",
			"articles",
			"solutions",
			"about",
			"contact",
		]);
	});

	it("active Solutions sur l'index et sur chaque page produit", () => {
		expect(active("/solutions")).toEqual(["solutions"]);
		expect(active("/solutions/grammaria")).toEqual(["solutions"]);
		expect(active("/")).toEqual(["home"]);
	});
});
