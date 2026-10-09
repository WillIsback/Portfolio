export interface Step {
	year: string;
	title: string;
	description: string;
}

/** Âge révolu à `date` (calcul en UTC, déterministe). */
export function ageOn(date: Date, birth = "1993-05-01"): number {
	const born = new Date(birth);
	let age = date.getUTCFullYear() - born.getUTCFullYear();
	const monthDiff = date.getUTCMonth() - born.getUTCMonth();
	if (
		monthDiff < 0 ||
		(monthDiff === 0 && date.getUTCDate() < born.getUTCDate())
	) {
		age--;
	}
	return age;
}

export const PARCOURS: Step[] = [
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
		year: "Septembre 2025 – juillet 2026",
		title: "Diplômé Développeur full stack",
		description:
			"Parcours Développeur FullStack IA chez OpenClassrooms, validé en juillet 2026 par le titre « Développeur full stack » (RNCP42641), niveau 6 (bac +3/4, EQF 6).",
	},
	{
		year: "Janvier 2026",
		title: "Cellule IA - DSI Régionale",
		description:
			"Membre actif de la cellule IA de la DSI régionale, déterminé à concrétiser des projets exploitant le potentiel de l'IA pour répondre aux besoins métier.",
	},
	{
		year: "Septembre 2026 – en cours",
		title: "Parcours AI Engineer",
		description:
			"Dans la continuité, parcours AI Engineer chez OpenClassrooms, qui prépare au titre « Expert en ingénierie et science des données », enregistré au RNCP, niveau 7 (bac +5, EQF 7).",
	},
];
