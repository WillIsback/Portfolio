import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "À propos | William Derue - Développeur FullStack IA",
	description:
		"Découvrez mon parcours - De l'automaticien au développeur fullstack IA. 7 ans d'expertise en technologie et intelligence artificielle.",
	keywords: [
		"à propos",
		"parcours",
		"automaticien",
		"développeur",
		"IA",
		"timeline",
	],
	openGraph: {
		type: "website",
		locale: "fr_FR",
		url: "https://www.willisback.fr/about",
		title: "À propos | William Derue",
		description: "Mon parcours professionnel et ma spécialisation en IA",
		siteName: "Portfolio WillisBack",
	},
	twitter: {
		card: "summary",
		title: "À propos | William Derue",
		description: "Découvrez mon parcours en tant que développeur fullstack IA",
	},
};

export default function AboutLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
