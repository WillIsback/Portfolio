import type { Metadata } from "next";
import {
	Bricolage_Grotesque,
	Caveat,
	Fira_Code,
	Source_Serif_4,
} from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { routing } from "@/i18n/routing";

import "../globals.css";

const bricolage = Bricolage_Grotesque({
	subsets: ["latin"],
	weight: ["600", "700"],
	variable: "--font-bricolage",
	display: "swap",
});
const sourceSerif = Source_Serif_4({
	subsets: ["latin"],
	weight: ["400", "600"],
	style: "normal",
	variable: "--font-source-serif",
	display: "swap",
});
const sourceSerifItalic = Source_Serif_4({
	subsets: ["latin"],
	weight: ["400", "600"],
	style: "italic",
	variable: "--font-source-serif-italic",
	preload: false,
	display: "swap",
});
const caveat = Caveat({
	subsets: ["latin"],
	weight: ["500"],
	variable: "--font-caveat",
	preload: false,
	display: "swap",
});
const firaCode = Fira_Code({
	subsets: ["latin"],
	weight: ["400", "500"],
	variable: "--font-fira",
	preload: false,
	display: "swap",
});

/** Locale OpenGraph : `fr` → `fr_FR`. */
function ogLocale(locale: string): string {
	return locale === "fr" ? "fr_FR" : locale === "en" ? "en_US" : "zh_CN";
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

	return (
		<html
			lang={locale}
			suppressHydrationWarning
			className={`${bricolage.variable} ${sourceSerif.variable} ${sourceSerifItalic.variable} ${caveat.variable} ${firaCode.variable}`}
		>
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
