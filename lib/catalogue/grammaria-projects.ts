import type { AdminProject } from "@/schemas";

/**
 * Fiches Grammaria et grammaria-rc (21 novembre 2026). Grammaria est issu
 * d'ai_corrector (fiche 22), qui garde sa propre fiche. Les textes restent en
 * français : les fiches projet ne sont pas traduites.
 */
export const GRAMMARIA_PROJECTS: AdminProject[] = [
	{
		title: "Grammaria",
		pitch:
			"Correcteur de français par IA locale qui nomme chaque faute et repère celles qui reviennent, sans garder vos textes.",
		description:
			"Correcteur de français qui corrige tout de suite avec un modèle de langage choisi par l'utilisateur (Ollama, vLLM ou toute API compatible OpenAI), puis nomme chaque faute avec son propre moteur de grammaire, grammaria-rc. Un journal local, sans aucun texte, repère les fautes qui reviennent et propose une astuce près du bouton Copier ; une note sur 20, un écran Progression et des badges montrent le chemin parcouru. Application de bureau Tauri 2 (Windows, Linux) et serveur Docker. Bêta publique 0.5 depuis le 21 novembre 2026, pour vérifier si les astuces font vraiment progresser. Issu d'ai_corrector, licence GPL-3.0.",
		imagePath: "",
		github: "https://github.com/WillIsback/Grammaria",
		lastUpdate: "2026-11-21T18:44:45.000Z",
		isPrivate: false,
		isAiGenerated: false,
		status: "InProgress",
		githubRepoId: 1463351902,
		languages: ["TypeScript", "Rust"],
		databases: [],
		backends: [],
		frontends: ["React"],
		devops: ["Docker", "GithubActions"],
		domains: ["LLM", "NLP"],
		mlStack: ["LlmSdk"],
		practices: [
			"ContinuousIntegration",
			"Containerization",
			"ContinuousDeployment",
			"AutomatedTesting",
			"Observability",
			"SecretsManagement",
			"Hardening",
		],
		training: null,
	},
	{
		title: "grammaria-rc",
		pitch:
			"Le correcteur français de LanguageTool porté en Rust, correspondance pour correspondance, puis étendu de 1 320 règles.",
		description:
			"Moteur de grammaire et d'orthographe française en Rust, sans dépendance. Il lit tels quels les fichiers de règles et dictionnaires français de LanguageTool (7 017 règles XML, correcteur Morfologik) à travers un portage Rust de la même chaîne d'analyse : 99,97 % des textes d'un banc de 29 047 donnent exactement les mêmes résultats que la référence. Il y ajoute 1 320 règles propres et un profil qui retire les fausses alarmes : 86,4 % des fautes trouvées contre 76,4 %, démarrage en 0,5 s au lieu de 4,5 s et 220 à 250 Mio de mémoire au lieu de 930. Bibliothèque, ligne de commande et mode serveur ; publié sur crates.io, licence LGPL-2.1.",
		imagePath: "",
		github: "https://github.com/WillIsback/grammaria-rc",
		lastUpdate: "2026-11-21T11:47:46.000Z",
		isPrivate: false,
		isAiGenerated: false,
		status: "InProgress",
		githubRepoId: 1464847655,
		languages: ["Rust"],
		databases: [],
		backends: [],
		frontends: [],
		devops: [],
		domains: ["NLP"],
		mlStack: [],
		practices: ["AutomatedTesting"],
		training: null,
	},
];
