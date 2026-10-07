import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import InkPath from "./InkPath";
import MarginNote from "./MarginNote";

// Mock framer-motion with useReducedMotion returning true
vi.mock("framer-motion", async (orig) => ({
	...(await orig()),
	useReducedMotion: () => true,
}));

describe("MarginNote (reduced-motion)", () => {
	it("never animates opacity and has no inline transform/translate styles in reduced mode", () => {
		const html = renderToStaticMarkup(
			<MarginNote>essaie « vision »</MarginNote>,
		);
		expect(html).not.toContain("opacity:0");
		expect(html).not.toContain("transform");
		expect(html).not.toContain("translate");
	});
});

describe("InkPath (reduced-motion)", () => {
	it("never animates pathLength and has no stroke-dashoffset/opacity hiding in reduced mode", () => {
		const html = renderToStaticMarkup(
			<svg aria-hidden="true">
				<InkPath d="M0 0 L10 10" />
			</svg>,
		);
		expect(html).not.toContain("stroke-dashoffset");
		expect(html).not.toContain("opacity:0");
	});
});
