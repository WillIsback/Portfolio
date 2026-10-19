import { describe, expect, it } from "vitest";
import fr from "@/messages/fr.json";
import { escapeHtml, renderFr } from "@/tests/i18n-render";
import { mdxComponents } from "./index";
import Note from "./Note";

describe("Note", () => {
	it("est disponible dans le MDX", () => {
		expect(mdxComponents.Note).toBe(Note);
	});

	it("annonce la note comme du texte normal, préfixé pour les lecteurs d'écran", () => {
		const html = renderFr(<Note>le scan revenait toutes les 10 min</Note>);
		expect(html).toContain(
			`<span class="sr-only">${escapeHtml(fr.mdx.notePrefix)}</span>`,
		);
		expect(html).toContain("le scan revenait toutes les 10 min");
		expect(html).not.toContain("aria-hidden");
		expect(html).not.toContain("opacity:0");
	});

	it("se place en marge sur grand écran et dans le flux sur mobile", () => {
		const html = renderFr(<Note>x</Note>);
		expect(html).toContain("xl:absolute");
		expect(html).toContain("relative");
	});
});
