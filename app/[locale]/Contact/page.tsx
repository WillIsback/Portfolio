import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import { routing } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import ContactForm from "./ContactForm";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "meta.contact" });
	return pageMetadata(locale, "/Contact", {
		title: t("title"),
		description: t("description"),
	});
}

/**
 * Coquille serveur de la fiche contact.
 *
 * Le formulaire interactif vit dans `ContactForm.tsx` (client) : c'est ce qui permet à
 * cette page de rester un Server Component, donc d'appeler `getTranslations` pour
 * l'en-tête ci-dessous, interdit dans un composant client.
 */
export default async function Contact({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("contact");

	return (
		<main className="relative min-h-screen flex flex-col">
			<div className="sticky top-0 z-50 w-full">
				<Header />
			</div>
			<div className="mx-auto w-full min-w-3/5 max-w-6xl px-4 pt-10 sm:w-auto">
				<header className="mb-10 space-y-3">
					<p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
						{t("eyebrow")}
					</p>
					<h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-foreground">
						{t("title")}
					</h1>
					<p className="text-muted-foreground">{t("intro")}</p>
				</header>
				<ContactForm />
			</div>
			<Footer />
		</main>
	);
}
