import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(
	path.join(process.cwd(), "app/Contact/page.tsx"),
	"utf8",
);

describe("Contact (fiche du carnet)", () => {
	it("n'utilise plus framer-motion", () => {
		expect(page).not.toContain("framer-motion");
		expect(page).not.toContain("motion.");
	});

	it("garde la logique d'envoi et de validation", () => {
		expect(page).toContain("useActionState(sendEmail");
		expect(page).toContain("useFormValidation");
		expect(page).toContain("<ThemedToaster />");
	});

	it("annonce les erreurs de champ et les relie aux champs", () => {
		expect(page).toContain('role="alert"');
		expect(page).toContain("aria-describedby");
		expect(page).toContain("aria-invalid");
	});

	it("se présente comme une fiche du carnet", () => {
		expect(page).toContain("Fiche");
		expect(page).toContain("font-mono");
	});

	it("met la couleur de bordure dans le ternaire (invalide = destructive, sinon ink-soft)", () => {
		expect(page).toContain('"border-destructive focus:border-destructive"');
		expect(page).toContain('"border-ink-soft focus:border-primary"');
		expect(page).not.toMatch(/rounded-none[^`$]*border-ink-soft/);
	});

	it("garde des bordures de champ contrastées (WCAG 1.4.11)", () => {
		expect(page).not.toContain("border-ink-soft/50");
		expect(page).not.toContain("ring-ring/50");
	});

	it("laisse le bouton actif hors envoi (plus de disabled={isPending || !isValid})", () => {
		expect(page).not.toContain("disabled={isPending || !isValid}");
		expect(page).toContain("disabled={isPending}");
	});

	it("annonce le résumé des erreurs dans une région live et ramène le focus", () => {
		expect(page).toContain('aria-live="polite"');
		expect(page).toContain("errorSummary");
		expect(page).toContain("firstInvalidField");
		expect(page).toContain(".focus()");
	});

	it("affiche aussi les erreurs renvoyées par le serveur (sans JavaScript)", () => {
		expect(page).toContain("firstServerErrors");
		expect(page).toContain("serverErrors");
	});
});
