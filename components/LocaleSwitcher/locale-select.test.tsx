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

	it("annonce chaque option dans sa propre langue", () => {
		// `lang` est lié à la *valeur* de l'option, pas seulement présent dans le
		// balisage : les assertions précédentes laisseraient passer une langue
		// annoncée correctement mais attribuée à la mauvaise entrée.
		for (const code of routing.locales) {
			expect(html).toMatch(
				new RegExp(`<option(?=[^>]*value="${code}")(?=[^>]*lang="${code}")`),
			);
		}
	});

	it("marque la langue active", () => {
		expect(html).toMatch(/<option[^>]*value="fr"[^>]*selected/);
	});

	it("expose un libellé étiqueté pour les lecteurs d'écran", () => {
		expect(html).toMatch(/<label[^>]*for="locale-switcher"/);
		expect(html).toContain('id="locale-switcher"');
		expect(html).toContain(`aria-label="${fr.locale.label}"`);
		// `label` et `select` sont des frères, pas imbriqués : les assertions
		// ci-dessus ne trouvent qu'une paire for/id, peu importe l'ordre. Cette
		// assertion est ordonnée, et `<select>` n'autorise que option/optgroup/hr —
		// un `<label>` imbriqué serait du HTML invalide en plus d'inaccessible.
		expect(html).toMatch(/<\/label><select/);
	});

	it("reste compatible avec les trois locales du routage", () => {
		expect(routing.locales).toEqual(["fr", "en", "zh"]);
		// `Object.keys(labels)` ne prouverait rien : une locale sans entrée dans
		// `names` donnerait quand même sa clé, et rendrait une option vide plutôt
		// qu'une erreur. On compare donc au dictionnaire — avec `toStrictEqual`,
		// car `toEqual` ignore les clés dont la valeur est `undefined` et
		// laisserait passer exactement ce cas.
		expect(labels).toStrictEqual(fr.locale.names);
	});
});
