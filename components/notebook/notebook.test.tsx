import { readFileSync } from "node:fs";
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
		expect(html).not.toContain("<aside");
		expect(html).toContain('role="note"');
		expect(html).toContain("essaie « vision »");
	});

	it("diffère la police manuscrite : absente du HTML serveur, texte déjà complet", () => {
		const html = renderToStaticMarkup(<MarginNote>note</MarginNote>);
		expect(html).not.toContain("font-hand");
		expect(html).toContain("note-in");
		expect(html).toContain(">note<");
	});

	it("n'importe plus framer-motion", () => {
		const src = readFileSync("components/notebook/MarginNote.tsx", "utf8");
		expect(src).not.toContain("framer-motion");
	});

	it("anime la note en CSS (transform seul), coupé en mouvement réduit", () => {
		const css = readFileSync("app/globals.css", "utf8");
		const keyframes = css.match(/@keyframes note-in\s*\{[^}]*\}/)?.[0] ?? "";
		expect(keyframes).toContain("translateY(4px)");
		expect(keyframes).not.toContain("opacity");
		expect(css).toMatch(
			/\.note-in\s*\{[^}]*animation:[^}]*note-in 0\.4s[^}]*0\.25s/,
		);
		expect(css).toMatch(
			/prefers-reduced-motion: reduce\)\s*\{[^@]*\.note-in\s*\{\s*animation: none/,
		);
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
