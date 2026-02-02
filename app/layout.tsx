import type { Metadata } from "next";
import { Fira_Code, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
	subsets: ["latin"],
	variable: "--font-display",
});
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
	title: "William Derue | Développeur FullStack IA",
	description: "Portfolio de William Derue - Développeur fullstack spécialisé en IA. Architectures full-stack propulsées par l'intelligence artificielle.",
	keywords: [
		"développeur fullstack",
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
		title: "William Derue | Développeur FullStack IA",
		description:
			"Portfolio de William Derue - Développeur fullstack spécialisé en IA. Découvrez mes projets et compétences.",
		siteName: "Portfolio WillisBack",
	},
	twitter: {
		card: "summary_large_image",
		title: "William Derue | Développeur FullStack IA",
		description:
			"Développeur fullstack spécialisé en IA - De la Data à la Décision",
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
		<html lang="fr">
			<body
				className={`${spaceGrotesk.variable} ${firaCode.variable} antialiased`}
			>
				{children}
				<Toaster richColors position="bottom-right" />
			</body>
		</html>
	);
}
