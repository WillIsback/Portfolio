import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import InkPath from "./InkPath";
import MarginNote from "./MarginNote";

// Sous SSR, useReducedMotion() renvoie null : le rendu serveur doit être l'état final.
vi.mock("framer-motion", async (orig) => ({
	...(await orig()),
	useReducedMotion: () => null,
}));

describe("SSR (useReducedMotion === null)", () => {
	it("InkPath rend le trait entièrement visible", () => {
		const html = renderToStaticMarkup(
			<svg aria-hidden="true">
				<InkPath d="M0 0 L10 10" />
			</svg>,
		);
		expect(html).not.toContain("0px 1px");
		expect(html).not.toContain("stroke-dasharray");
		expect(html).not.toContain("stroke-dashoffset");
	});

	it("MarginNote rend la note à sa place finale", () => {
		const html = renderToStaticMarkup(<MarginNote>note</MarginNote>);
		expect(html).not.toContain("translateY(");
		expect(html).not.toContain("transform");
		expect(html).not.toContain("opacity:0");
	});
});
