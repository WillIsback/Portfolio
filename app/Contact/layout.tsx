import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Formulaire de contact | William Derue",
	description:
		"Contactez William Derue pour discuter de vos projets IA ou fullstack. Envoyez-moi un message et je vous répondrai rapidement.",
	keywords: ["contact", "formulaire", "développeur", "IA", "fullstack"],
	openGraph: {
		type: "website",
		locale: "fr_FR",
		url: "https://www.willisback.fr/contact",
		title: "Formulaire de contact | William Derue",
		description:
			"Contactez William Derue pour discuter de vos projets et collaborations.",
		siteName: "Portfolio WillisBack",
	},
	twitter: {
		card: "summary",
		title: "Formulaire de contact | William Derue",
		description: "Envoyez-moi un message pour discuter de vos projets",
	},
};

export default function ContactLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
