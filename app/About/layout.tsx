import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "À propos | William Derue - Développeur IA · parcours AI Engineer",
	description:
		"Découvrez mon parcours - De l'automaticien au développeur IA, aujourd'hui en parcours AI Engineer. 7 ans d'expertise en technologie et intelligence artificielle.",
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
		description: "Mon parcours, de l'automatisme industriel à l'ingénierie IA",
	},
};

export default function AboutLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
