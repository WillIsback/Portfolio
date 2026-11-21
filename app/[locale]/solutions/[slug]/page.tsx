import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import JsonLd from "@/components/seo/JsonLd";
import SolutionPage from "@/components/solutions/SolutionPage";
import { routing } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import {
	isSolutionSlug,
	SOLUTION_SLUGS,
	SOLUTIONS,
	solutionCopy,
} from "@/lib/solutions";
import { softwareApplicationJsonLd } from "@/lib/structured-data";

/** Seules les solutions connues existent : tout autre slug répond 404. */
export const dynamicParams = false;

export function generateStaticParams() {
	return routing.locales.flatMap((locale) =>
		SOLUTION_SLUGS.map((slug) => ({ locale, slug })),
	);
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
	const { locale, slug } = await params;
	if (!hasLocale(routing.locales, locale) || !isSolutionSlug(slug)) return {};
	const t = await getTranslations({ locale, namespace: "meta.solutions" });
	const facts = SOLUTIONS[slug];
	return pageMetadata(locale, `/solutions/${slug}`, {
		title: t("product", { name: facts.name }),
		description: solutionCopy(slug, locale).summary,
	});
}

export default async function Solution({
	params,
}: {
	params: Promise<{ locale: string; slug: string }>;
}) {
	const { locale, slug } = await params;
	if (!hasLocale(routing.locales, locale) || !isSolutionSlug(slug)) notFound();
	setRequestLocale(locale);
	const facts = SOLUTIONS[slug];
	const copy = solutionCopy(slug, locale);

	return (
		<main className="relative flex min-h-screen flex-col">
			<JsonLd data={softwareApplicationJsonLd(locale, facts, copy)} />
			<div className="sticky top-0 z-50 w-full">
				<Header />
			</div>
			<div className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
				<SolutionPage facts={facts} copy={copy} />
			</div>
			<Footer />
		</main>
	);
}
