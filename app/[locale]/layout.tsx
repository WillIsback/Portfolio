import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { type Locale, routing } from "@/i18n/routing";
import { cjkFontVariable, fontVariables } from "@/lib/fonts";

import "../globals.css";

/**
 * Locale OpenGraph : `fr` → `fr_FR`.
 *
 * Table fermée plutôt qu'une cascade ternaire : une locale inconnue doit casser
 * bruyamment (elle n'est pas dans `Record<Locale, …>`), pas être étiquetée `zh_CN`.
 */
const OG_LOCALES: Record<Locale, string> = {
	fr: "fr_FR",
	en: "en_US",
	zh: "zh_CN",
};

function ogLocale(locale: Locale): string {
	return OG_LOCALES[locale];
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "meta" });

	return {
		title: t("title"),
		description: t("description"),
		keywords: t.raw("keywords"),
		authors: [{ name: "William Derue" }],
		creator: "William Derue",
		metadataBase: new URL("https://www.willisback.fr"),
		openGraph: {
			type: "website",
			locale: ogLocale(locale),
			url: "https://www.willisback.fr",
			title: t("title"),
			description: t("description"),
			siteName: "Portfolio WillisBack",
		},
		twitter: {
			card: "summary_large_image",
			title: t("title"),
			description: t("description"),
		},
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				"max-video-preview": -1,
				"max-image-preview": "large",
				"max-snippet": -1,
			},
		},
	};
}

/** Sans cela, le segment `[locale]` serait rendu dynamiquement et chaque page perdrait son export statique. */
export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();

	setRequestLocale(locale);

	// `--font-cjk` n'est posé que pour le chinois : les glyphes latins n'en ont pas besoin,
	// et le bloc `:lang(zh)` de `globals.css` s'appuie sur sa présence pour remapper les
	// visages du labo. L'admin (monolingue) garde `fontVariables` seul.
	const fontClasses =
		locale === "zh" ? `${fontVariables} ${cjkFontVariable}` : fontVariables;

	return (
		<html lang={locale} suppressHydrationWarning className={fontClasses}>
			<body className="paper antialiased">
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					{/* Rend la config de requête accessible aux composants clients. */}
					<NextIntlClientProvider>{children}</NextIntlClientProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
