import type { Metadata } from "next";
import {
	Bricolage_Grotesque,
	Caveat,
	Fira_Code,
	Source_Serif_4,
} from "next/font/google";
import ThemedToaster from "@/components/theme/ThemedToaster";
import ThemeProvider from "@/components/theme/ThemeProvider";

import "./globals.css";

const bricolage = Bricolage_Grotesque({
	subsets: ["latin"],
	weight: ["600", "700"],
	variable: "--font-bricolage",
	display: "swap",
});
const sourceSerif = Source_Serif_4({
	subsets: ["latin"],
	weight: ["400", "600"],
	style: ["normal", "italic"],
	variable: "--font-source-serif",
	display: "swap",
});
const caveat = Caveat({
	subsets: ["latin"],
	weight: ["500"],
	variable: "--font-caveat",
	display: "swap",
});
const firaCode = Fira_Code({
	subsets: ["latin"],
	weight: ["400", "500"],
	variable: "--font-fira",
	display: "swap",
});

export const metadata: Metadata = {
	title: "William Derue | Développeur IA · parcours AI Engineer",
	description:
		"Portfolio de William Derue - Développeur IA en parcours AI Engineer : projets de machine learning, LLM et infrastructure, et retours d'expérience.",
	keywords: [
		"développeur fullstack",
		"AI engineer",
		"machine learning",
		"IA",
		"intelligence artificielle",
		"React",
		"Next.js",
		"TypeScript",
		"portfolio",
	],
	authors: [{ name: "William Derue" }],
	creator: "William Derue",
	metadataBase: new URL("https://www.willisback.fr"),
	openGraph: {
		type: "website",
		locale: "fr_FR",
		url: "https://www.willisback.fr",
		title: "William Derue | Développeur IA · parcours AI Engineer",
		description:
			"Portfolio de William Derue - Développeur IA en parcours AI Engineer. Projets, expériences et articles.",
		siteName: "Portfolio WillisBack",
	},
	twitter: {
		card: "summary_large_image",
		title: "William Derue | Développeur IA · parcours AI Engineer",
		description:
			"Développeur IA en parcours AI Engineer - De la Data à la Décision",
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

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="fr"
			suppressHydrationWarning
			className={`${bricolage.variable} ${sourceSerif.variable} ${caveat.variable} ${firaCode.variable}`}
		>
			<body className="paper antialiased">
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					{children}
					<ThemedToaster />
				</ThemeProvider>
			</body>
		</html>
	);
}
