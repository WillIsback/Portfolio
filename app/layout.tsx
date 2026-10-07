import type { Metadata } from "next";
import { Fira_Code, Space_Grotesk } from "next/font/google";
import ThemedToaster from "@/components/theme/ThemedToaster";
import ThemeProvider from "@/components/theme/ThemeProvider";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
	subsets: ["latin"],
	variable: "--font-display",
});
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-mono" });

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
		<html lang="fr" suppressHydrationWarning>
			<body
				className={`${spaceGrotesk.variable} ${firaCode.variable} antialiased`}
			>
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
