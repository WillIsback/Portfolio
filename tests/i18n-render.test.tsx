import { useTranslations } from "next-intl";
import { describe, expect, it } from "vitest";
import fr from "@/messages/fr.json";
import { renderFr } from "./i18n-render";

function Probe() {
	const t = useTranslations("notFound");
	return <span>{t("title")}</span>;
}

describe("renderFr", () => {
	/**
	 * Garde le helper : sans provider, ou avec un dictionnaire mal branché, le rendu
	 * ne contient plus le texte attendu. On compare à `fr.json` et non à un littéral,
	 * pour que le test suive la tâche 8 au lieu de s'y opposer.
	 *
	 * Ce test ne verrouille PAS `deps.inline: ["next-intl"]` du `vitest.config.ts` :
	 * `renderFr` n'atteint que l'entrée racine de `next-intl` (`index.react-client.js`),
	 * qui n'importe jamais `next/server`. Ce réglage est en réalité porté par
	 * `proxy.test.ts` et `proxy.seam.test.ts`, via `next-intl/middleware` — seul point
	 * d'entrée qui tire `next/server` et échoue bruyamment sans inlining. Vérifié en
	 * retirant `next-intl` de la liste : ce fichier passe, les deux proxy échouent.
	 */
	it("rend un composant traduit avec les messages réels de fr.json", () => {
		expect(renderFr(<Probe />)).toContain(fr.notFound.title);
	});
});
