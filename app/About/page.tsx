"use client";

import { motion } from "framer-motion";
import { BookOpenText } from "lucide-react";
import { useRef } from "react";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";

function getAge() {
	const today = new Date();
	const birthDate = new Date("1993-05-01");
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();

	if (
		monthDiff < 0 ||
		(monthDiff === 0 && today.getDate() < birthDate.getDate())
	) {
		age--;
	}

	return age;
}

const timelineItems = [
	{
		year: "2015-2022",
		title: "Automaticien",
		description:
			"7 ans en tant qu'automaticien dans le secteur de l'énergie, construisant des petites centrales électriques. L'émergence de l'IA a considérablement enrichi mon intérêt pour l'informatique et ma soif de connaissance.",
	},
	{
		year: "2023-2024",
		title: "Développeur C++",
		description:
			"Passage à l'informatique logiciel avec un projet C++ professionnel, suivi de plusieurs projets personnels explorant différentes technologies.",
	},
	{
		year: "Novembre 2024",
		title: "Administrateur Système",
		description:
			"Intégration au ministère de l'Éducation nationale en tant qu'administrateur système, poste que j'occupe toujours avec responsabilités croissantes.",
	},
	{
		year: "2025-2026",
		title: "Formation FullStack IA",
		description:
			"Suivi une formation complète de développeur FullStack spécialisé en IA chez OpenClassrooms pour approfondir mes compétences.",
	},
	{
		year: "Janvier 2026",
		title: "Cellule IA - DSI Régionale",
		description:
			"Membre actif de la cellule IA de la DSI régionale, déterminé à concrétiser des projets exploitant le potentiel de l'IA pour répondre aux besoins métier.",
	},
];

export default function About() {
	const age = getAge();
	const contactBtnRef = useRef<HTMLButtonElement>(null);

	return (
		<main className="relative min-h-screen flex flex-col bg-background">
			<div className="sticky top-0 z-50 p-6 flex justify-center w-full">
				<Header highlightContact={false} contactBtnRef={contactBtnRef} />
			</div>

			<div className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
				<div className="max-w-6xl mx-auto">
					{/* Intro avec logo */}
					<div className="mb-20 flex items-center gap-8">
						<motion.div
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.6 }}
							className="shrink-0"
						></motion.div>
						<BookOpenText size={75} />
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.6, delay: 0.2 }}
							className="space-y-4"
						>
							<h1 className="text-5xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
								William Derue
							</h1>
							<p className="text-xl text-primary font-medium">
								Développeur fullstack IA
							</p>
							<p className="text-lg text-muted-foreground">
								{age} ans — Sud de la France
							</p>
						</motion.div>
					</div>

					{/* Timeline */}
					<div className="relative">
						{/* Ligne verticale */}
						<div className="absolute left-0 md:left-1/4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary to-transparent" />

						{/* Éléments timeline */}
						<div className="space-y-12">
							{timelineItems.map((item, index) => (
								<motion.div
									key={index}
									initial={{ opacity: 0, x: -20 }}
									whileInView={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.5, delay: index * 0.1 }}
									viewport={{ once: true, margin: "-100px" }}
									className="relative pl-16 md:pl-0 md:flex md:gap-12"
								>
									{/* Point sur la timeline */}
									<div className="absolute left-0 md:left-1/4 top-2 w-4 h-4 rounded-full bg-primary border-4 border-background transform -translate-x-1.5" />

									{/* Year badge (visible sur mobile à gauche, hidden sur desktop) */}
									<div className="md:w-1/4 hidden md:block">
										<div className="sticky top-24 text-right pr-12">
											<span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-display font-bold text-sm">
												{item.year}
											</span>
										</div>
									</div>

									{/* Contenu */}
									<motion.div
										initial={{ opacity: 0, y: 10 }}
										whileInView={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
										viewport={{ once: true, margin: "-100px" }}
										className="md:w-1/2 space-y-3"
									>
										<div className="md:hidden mb-3">
											<span className="text-sm font-display font-bold text-primary">
												{item.year}
											</span>
										</div>
										<h3 className="text-2xl font-display font-bold text-foreground">
											{item.title}
										</h3>
										<p className="text-base text-foreground leading-relaxed bg-card border border-border rounded-lg p-4">
											{item.description}
										</p>
									</motion.div>
								</motion.div>
							))}
						</div>
					</div>
				</div>
			</div>
			<Footer />
		</main>
	);
}
