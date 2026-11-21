import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import JsonLd from "@/components/seo/JsonLd";
import SolutionCard from "@/components/solutions/SolutionCard";
import { routing } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { SOLUTION_SLUGS, SOLUTIONS, solutionCopy } from "@/lib/solutions";
import { softwareApplicationJsonLd } from "@/lib/structured-data";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "meta.solutions" });
	return pageMetadata(locale, "/solutions", {
		title: t("title"),
		description: t("description"),
	});
}

export default async function Solutions({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	const t = await getTranslations("solutions");
	const items = SOLUTION_SLUGS.map((slug) => ({
		facts: SOLUTIONS[slug],
		copy: solutionCopy(slug, locale),
	}));

	return (
		<main className="relative flex min-h-screen flex-col">
			<JsonLd
				data={items.map(({ facts, copy }) =>
					softwareApplicationJsonLd(locale, facts, copy),
				)}
			/>
			<div className="sticky top-0 z-50 w-full">
				<Header />
			</div>

			<div className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-4xl">
					<header className="mb-12 space-y-3">
						<p className="font-mono text-sm text-ink-soft">{t("eyebrow")}</p>
						<h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
							{t("title")}
						</h1>
						<p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
							{t("intro")}
						</p>
					</header>
					<div className="grid gap-6 md:grid-cols-2">
						{items.map(({ facts, copy }) => (
							<SolutionCard key={facts.slug} facts={facts} copy={copy} />
						))}
					</div>
				</div>
			</div>
			<Footer />
		</main>
	);
}
