import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Chronology from "@/components/about/Chronology";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import { routing } from "@/i18n/routing";
import { ageOn, parcours } from "@/lib/about";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 86400;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "meta.about" });
	return pageMetadata(locale, "/About", {
		title: t("title"),
		description: t("description"),
	});
}

export default async function About({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const steps = parcours(await getTranslations("parcours"));
	const t = await getTranslations("about");

	return (
		<main className="relative flex min-h-screen flex-col">
			<div className="sticky top-0 z-50 w-full">
				<Header />
			</div>

			<div className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-4xl">
					<header className="mb-16 space-y-3">
						<p className="font-mono text-sm text-ink-soft">{t("eyebrow")}</p>
						<h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
							William Derue
						</h1>
						<p className="text-xl font-medium text-primary">{t("tagline")}</p>
						<p className="text-lg text-muted-foreground">
							{t("ageLine", { age: ageOn(new Date()) })}
						</p>
					</header>

					<Chronology steps={steps} />
				</div>
			</div>
			<Footer />
		</main>
	);
}
