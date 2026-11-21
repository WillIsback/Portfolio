import type { AdminProject } from "@/schemas";

/**
 * Convention de nommage des projets OpenClassrooms (21 novembre 2026) :
 * `OC-{Parcours}-{numéro projet}-{Nom projet}`, parcours `DIA` (Développeur IA,
 * `FullstackAI` en base) ou `AIE` (AI Engineer). Le titre d'une fiche OC reprend
 * le nom de son dépôt GitHub.
 */

/** Titres des fiches OC existantes : id → ancien et nouveau titre. */
export const OC_TITLE_RENAMES: Record<number, { from: string; to: string }> = {
	1: { from: "Abricot.co", to: "OC-DIA-P11-Abricot" },
	6: { from: "OC-P10 TechNova Livrable", to: "OC-DIA-P10-TechNova-Livrable" },
	7: { from: "OC-P9 Fisheye", to: "OC-DIA-P9-Fisheye" },
	8: { from: "P8 Bottleneck", to: "OC-DIA-P8-Bottleneck" },
	9: { from: "OC-P7 DataImmo", to: "OC-DIA-P7-DataImmo" },
	10: { from: "SportSee", to: "OC-DIA-P6-Sportsee" },
	11: { from: "Les Petits Plats", to: "OC-DIA-P5-Les-Petits-Plats" },
	12: {
		from: "Fashion Trend Intelligence",
		to: "OC-DIA-P4-Fashion-Trend-Intelligence",
	},
	16: { from: "p12-phase2-zenassist", to: "OC-DIA-P12-ZenAssist-Phase2" },
	17: { from: "p12-phase1-zenassist", to: "OC-DIA-P12-ZenAssist-Phase1" },
	18: {
		from: "p12-zenassist-training-modernbert-cls",
		to: "OC-DIA-P12-ZenAssist-Training",
	},
	19: { from: "P14-NewsFoundry", to: "OC-DIA-P14-NewsFoundry" },
	26: { from: "P13-Fashion-Insta", to: "OC-DIA-P13-Fashion-Insta" },
	27: {
		from: "OC-P5_Deployez_un_modele_de_Machine_Learning",
		to: "OC-AIE-P5-Deployez-un-modele-de-Machine-Learning",
	},
	28: {
		from: "OC-Ai-Engineer-P3",
		to: "OC-AIE-P3-Anticipez-les-besoins-en-consommation-de-batiments-de-Seattle",
	},
};

const repo = (name: string) => `https://github.com/WillIsback/${name}`;

const EMPTY = {
	isPrivate: false,
	isAiGenerated: false,
	databases: [],
	backends: [],
	frontends: [],
	devops: [],
	domains: [],
	mlStack: [],
	practices: [],
} satisfies Partial<AdminProject>;

/**
 * Dépôts OC absents du portfolio au 21 novembre 2026. Les fiches restent en
 * français (les fiches projet ne sont pas traduites), `githubRepoId` pour que la
 * synchronisation GitHub suive un futur renommage.
 */
export const NEW_OC_PROJECTS: AdminProject[] = [
	{
		...EMPTY,
		title: "OC-AIE-P6-Initiez-vous-au-MLOps-Partie-1",
		description:
			"Pipeline MLOps de bout en bout pour le scoring crédit Home Credit, dans un notebook exécutable : EDA, agrégats des six tables secondaires, baselines pondérées (régression logistique, LightGBM), feature engineering automatisé (OpenFE), sélection de variables (BorutaShap), réglage Optuna sur un coût métier où un faux négatif coûte dix faux positifs, MLflow Model Registry, serving pyfunc et application Gradio d'inférence.",
		pitch:
			"Scoring crédit Home Credit : du notebook au modèle servi, avec Optuna, MLflow Registry et une app Gradio.",
		imagePath: "logo/ML.svg",
		github: repo("OC-AIE-P6-Initiez-vous-au-MLOps-Partie-1"),
		lastUpdate: "2026-11-21T16:01:36.000Z",
		githubRepoId: 1433192842,
		languages: ["Python"],
		backends: ["JupyterNotebook"],
		domains: ["DataAnalysis", "ML", "Classifier"],
		mlStack: ["ScikitLearn", "Pandas"],
		practices: ["ExperimentTracking", "ModelRegistry", "ModelServing"],
		training: "AIEngineer",
	},
	{
		...EMPTY,
		title: "OC-AIE-P7-Assistant-evenements-culturels",
		description:
			"POC d'assistant conversationnel qui recommande des événements culturels récents issus de l'API Open Agenda. RAG avec LangChain, modèles Mistral et index vectoriel Faiss ; API REST FastAPI ; image Docker publiée sur GHCR à chaque release. CI complète : qualité, tests, sécurité, CodeQL, Dependabot.",
		pitch:
			"Assistant RAG (LangChain, Mistral, Faiss, FastAPI) qui recommande des événements culturels Open Agenda.",
		imagePath: "",
		github: repo("OC-AIE-P7-Assistant-evenements-culturels"),
		lastUpdate: "2026-11-21T16:15:00.000Z",
		status: "InProgress",
		githubRepoId: 1449442242,
		languages: ["Python"],
		backends: ["FastAPI"],
		devops: ["Docker", "GithubActions"],
		domains: ["LLM", "NLP"],
		mlStack: ["LlmSdk"],
		practices: [
			"ContinuousIntegration",
			"Containerization",
			"ContinuousDeployment",
			"AutomatedTesting",
			"DependencyUpdates",
			"StaticAnalysis",
			"SecretsManagement",
		],
		training: "AIEngineer",
	},
	{
		...EMPTY,
		title: "OC-DIA-P10-TechNova",
		description:
			"Dépôt de travail du projet P10 (machine learning) : analyse exploratoire, modélisation et interprétation (XGBoost, SHAP, rééquilibrage des classes). La version présentée en soutenance est OC-DIA-P10-TechNova-Livrable.",
		imagePath: "logo/ML.svg",
		github: repo("OC-DIA-P10-TechNova"),
		lastUpdate: "2026-01-09T11:53:46.000Z",
		githubRepoId: 1111683650,
		languages: ["Python"],
		backends: ["JupyterNotebook"],
		domains: ["DataAnalysis", "ML", "Classifier"],
		mlStack: ["ScikitLearn", "Pandas", "XGBoost"],
		training: "FullstackAI",
	},
	{
		...EMPTY,
		title: "OC-DIA-P11-Abricot-Backend",
		description:
			"API REST du projet Abricot : authentification JWT, gestion de projets avec rôles et permissions, documentation Swagger/OpenAPI et script de données de test. Express, Prisma et SQLite.",
		imagePath: "logo/Abricot.svg",
		github: repo("OC-DIA-P11-Abricot-Backend"),
		lastUpdate: "2026-01-31T17:24:43.000Z",
		githubRepoId: 1143725904,
		languages: ["TypeScript"],
		databases: ["SQLite"],
		backends: ["ExpressJs"],
		practices: ["SecretsManagement", "Hardening"],
		training: "FullstackAI",
	},
	{
		...EMPTY,
		title: "OC-DIA-P12-ZenAssist-Phase3",
		description:
			"Phase 3 de ZenAssist : le classifieur LLM de la phase 2 est remplacé par le modèle scikit-learn de la phase 1 (SGDClassifier, F1 macro 0,685, moins d'une milliseconde par ticket) pour étiqueter les réclamations consommateurs à moindre coût. Déploiement full-stack : API Python FastAPI et frontend Next.js sur PostgreSQL.",
		imagePath: "",
		github: repo("OC-DIA-P12-ZenAssist-Phase3"),
		lastUpdate: "2026-11-21T16:08:36.000Z",
		githubRepoId: 1213314586,
		languages: ["Python", "TypeScript"],
		databases: ["Postgresql"],
		backends: ["FastAPI"],
		frontends: ["React", "NextJs"],
		devops: ["Docker", "GithubActions"],
		domains: ["ML", "Classifier", "NLP"],
		mlStack: ["ScikitLearn"],
		practices: ["ContinuousIntegration", "Containerization", "ModelServing"],
		training: "FullstackAI",
	},
	{
		...EMPTY,
		title: "OC-DIA-P2-Print-It",
		description:
			"Projet de découverte de JavaScript : carrousel dynamique du site de l'imprimerie Print-It, en HTML, CSS et JavaScript.",
		imagePath: "",
		github: repo("OC-DIA-P2-Print-It"),
		lastUpdate: "2025-08-27T07:56:30.000Z",
		githubRepoId: 1045461322,
		languages: ["JavaScript"],
		training: "FullstackAI",
	},
	{
		...EMPTY,
		title: "OC-DIA-P3-Sophie-Bluel",
		description:
			"Portfolio de l'architecte Sophie Bluel : frontend en JavaScript qui consomme une API Express (authentification, galerie, envoi de travaux), base SQLite.",
		imagePath: "logo/SophieBluel.svg",
		github: repo("OC-DIA-P3-Sophie-Bluel"),
		lastUpdate: "2025-08-25T13:30:14.000Z",
		githubRepoId: 1024513490,
		languages: ["JavaScript"],
		databases: ["SQLite"],
		backends: ["ExpressJs"],
		training: "FullstackAI",
	},
	{
		...EMPTY,
		title: "OC-DIA-P5-Ohmyfood",
		description:
			"Site de réservation de menus Ohmyfood, réalisé avec Next.js et React.",
		imagePath: "logo/OhMyFood.svg",
		github: repo("OC-DIA-P5-Ohmyfood"),
		lastUpdate: "2025-10-27T13:16:43.000Z",
		githubRepoId: 1049620378,
		languages: ["JavaScript"],
		frontends: ["React", "NextJs"],
		training: "FullstackAI",
	},
];
