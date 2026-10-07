import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import FigureCaption from "./FigureCaption";
import InkPath from "./InkPath";
import InkUnderline from "./InkUnderline";
import MarginNote from "./MarginNote";

describe("FigureCaption", () => {
	it("numérote la figure et garde la légende", () => {
		const html = renderToStaticMarkup(
			<FigureCaption number={2}>Carte des projets</FigureCaption>,
		);
		expect(html).toContain("<figcaption");
		expect(html).toContain("Fig. 2 · ");
		expect(html).toContain("Carte des projets");
	});
});

describe("MarginNote", () => {
	it("rend une note manuscrite lisible comme du texte", () => {
		const html = renderToStaticMarkup(
			<MarginNote>essaie « vision »</MarginNote>,
		);
		expect(html).toContain("<aside");
		expect(html).toContain("font-hand");
		expect(html).toContain("essaie « vision »");
	});

	it("ne cache jamais le contenu avec opacity:0 au repos", () => {
		const html = renderToStaticMarkup(
			<MarginNote>essaie « vision »</MarginNote>,
		);
		expect(html).not.toContain("opacity:0");
	});

	it("reste dans le flux quand inline est demandé", () => {
		const html = renderToStaticMarkup(
			<MarginNote inline>essaie « vision »</MarginNote>,
		);
		expect(html).not.toContain("xl:absolute");
	});
});

describe("InkPath", () => {
	it("rend un tracé à l'encre avec le chemin fourni", () => {
		const html = renderToStaticMarkup(
			<svg aria-hidden="true">
				<InkPath d="M0 0 L10 10" />
			</svg>,
		);
		expect(html).toContain('d="M0 0 L10 10"');
		expect(html).toContain('stroke="currentColor"');
		expect(html).toContain('fill="none"');
	});
});

describe("InkUnderline", () => {
	it("garde le texte souligné accessible et le trait décoratif masqué", () => {
		const html = renderToStaticMarkup(<InkUnderline>expériences</InkUnderline>);
		expect(html).toContain("expériences");
		expect(html).toContain('aria-hidden="true"');
	});

	it("garde une épaisseur de trait constante malgré l'étirement", () => {
		const html = renderToStaticMarkup(<InkUnderline>mot</InkUnderline>);
		expect(html).toContain('vector-effect="non-scaling-stroke"');
	});
});
