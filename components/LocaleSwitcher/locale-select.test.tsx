import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import fr from "@/messages/fr.json";
import LocaleSelect from "./LocaleSelect";

describe("LocaleSelect", () => {
	const labels = Object.fromEntries(
		routing.locales.map((code) => [
			code,
			fr.locale.names[code as keyof typeof fr.locale.names],
		]),
	);

	const html = renderToStaticMarkup(
		<LocaleSelect
			id="locale-switcher"
			value="fr"
			locales={routing.locales}
			labels={labels}
			label={fr.locale.label}
			onChange={() => {}}
		/>,
	);

	it("propose les trois langues avec leur nom natif", () => {
		expect(html).toContain('value="fr"');
		expect(html).toContain('value="en"');
		expect(html).toContain('value="zh"');
		expect(html).toContain(fr.locale.names.fr);
		expect(html).toContain(fr.locale.names.en);
		expect(html).toContain(fr.locale.names.zh);
	});

	it("marque la langue active", () => {
		expect(html).toMatch(/<option[^>]*value="fr"[^>]*selected/);
	});

	it("expose un libellé étiqueté pour les lecteurs d'écran", () => {
		expect(html).toMatch(/<label[^>]*for="locale-switcher"/);
		expect(html).toContain('id="locale-switcher"');
		expect(html).toContain(`aria-label="${fr.locale.label}"`);
	});

	it("reste compatible avec les trois locales du routage", () => {
		expect(routing.locales).toEqual(["fr", "en", "zh"]);
		expect(Object.keys(labels)).toEqual(["fr", "en", "zh"]);
	});
});
