import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * La fiche contact a été séparée serveur/client : `Contact/page.tsx` est une
 * coquille serveur (en-tête, `<Header>`, `<Footer>`) et toute la logique testée
 * ici — `useActionState`, validation, aria, `<ThemedToaster />` — vit dans le
 * composant client `ContactForm.tsx`.
 *
 * Les positives sont donc lues sur le formulaire, seul fichier où le comportement
 * existe ; les négatives sur les deux, voir `expectAbsent`.
 */

const read = (f: string) => readFileSync(path.join(process.cwd(), f), "utf8");

const form = read("app/[locale]/Contact/ContactForm.tsx");
const shell = read("app/[locale]/Contact/page.tsx");

/**
 * Une absence ne vaut que si elle tient dans les DEUX fichiers.
 *
 * La tâche 8 réécrit la coquille (`async` + `getTranslations`) : une régression
 * qui y réintroduirait `framer-motion` passerait inaperçue si la suite ne lisait
 * que le formulaire.
 */
function expectAbsent(needle: string) {
	expect(form).not.toContain(needle);
	expect(shell).not.toContain(needle);
}

/** Idem pour une absence exprimée par motif. */
function expectAbsentPattern(pattern: RegExp) {
	expect(form).not.toMatch(pattern);
	expect(shell).not.toMatch(pattern);
}

describe("Contact (fiche du carnet)", () => {
	it("n'utilise plus framer-motion", () => {
		expectAbsent("framer-motion");
		expectAbsent("motion.");
	});

	it("garde la logique d'envoi et de validation", () => {
		expect(form).toContain("useActionState(sendEmail");
		expect(form).toContain("useFormValidation");
		expect(form).toContain("<ThemedToaster />");
	});

	it("annonce les erreurs de champ et les relie aux champs", () => {
		expect(form).toContain('role="alert"');
		expect(form).toContain("aria-describedby");
		expect(form).toContain("aria-invalid");
	});

	it("se présente comme une fiche du carnet", () => {
		expect(form).toContain("Fiche");
		expect(form).toContain("font-mono");
	});

	it("met la couleur de bordure dans le ternaire (invalide = destructive, sinon ink-soft)", () => {
		expect(form).toContain('"border-destructive focus:border-destructive"');
		expect(form).toContain('"border-ink-soft focus:border-primary"');
		expectAbsentPattern(/rounded-none[^`$]*border-ink-soft/);
	});

	it("garde des bordures de champ contrastées (WCAG 1.4.11)", () => {
		expectAbsent("border-ink-soft/50");
		expectAbsent("ring-ring/50");
	});

	it("laisse le bouton actif hors envoi (plus de disabled={isPending || !isValid})", () => {
		expectAbsent("disabled={isPending || !isValid}");
		expect(form).toContain("disabled={isPending}");
	});

	it("annonce le résumé des erreurs dans une région live et ramène le focus", () => {
		expect(form).toContain('aria-live="polite"');
		expect(form).toContain("errorSummary");
		expect(form).toContain("firstInvalidField");
		expect(form).toContain(".focus()");
	});

	it("affiche aussi les erreurs renvoyées par le serveur (sans JavaScript)", () => {
		expect(form).toContain("firstServerErrors");
		expect(form).toContain("serverErrors");
	});
});
