import type { AdminProject } from "@/schemas";

/** Fiche du projet Syntheo en base. */
export const SYNTHEO_PROJECT_ID = 20;

/**
 * Fiche du projet 20 pour la bêta 0.7.0 (10 novembre 2026).
 *
 * L'ancienne fiche décrivait la première génération de Syntheo, une application web
 * Next.js / PostgreSQL devenue `WillIsback/Syntheo-web`. Le nom `WillIsback/Syntheo`
 * désigne désormais l'application desktop : `githubRepoId` suit ce dépôt, sinon la
 * synchronisation GitHub de l'admin comparerait la fiche à l'ancien.
 *
 * Les textes restent en français : les fiches projet ne sont pas traduites.
 */
export const SYNTHEO_PROJECT: AdminProject = {
	title: "Syntheo",
	pitch:
		"Bloc-notes de réunion open source et 100 % local : transcription en direct et comptes rendus avec vos propres modèles d'IA.",
	description:
		"Application desktop (Linux, Windows) qui transcrit les réunions en direct et en rédige le compte rendu avec des modèles d'IA hébergés sur site. Sans compte, sans cloud, sans robot dans l'appel ; l'audio n'est jamais conservé. Pensée pour les agents publics et les organisations qui ne peuvent pas envoyer leurs réunions dans le cloud. Tauri 2 (Rust) et React, base SQLite locale, transcription temps réel (NVIDIA NIM, Whisper via speaches), modèles de langage par API compatible OpenAI (vLLM, Ollama, MLX), annulation d'écho DTLN. Bêta publique 0.7.0 depuis le 10 novembre 2026. Dérivé d'Anarlog (MIT).",
	imagePath: "",
	github: "https://github.com/WillIsback/Syntheo",
	lastUpdate: "2026-11-10T00:00:00.000Z",
	isPrivate: false,
	isAiGenerated: false,
	status: "InProgress",
	githubRepoId: 1432142215,
	featuredRank: 4,
	languages: ["Rust", "TypeScript"],
	databases: ["SQLite"],
	backends: [],
	frontends: ["React"],
	devops: ["GithubActions"],
	domains: ["LLM", "NLP", "Speech"],
	mlStack: ["LlmSdk"],
	practices: [
		"ContinuousIntegration",
		"AutomatedTesting",
		"DependencyUpdates",
		"StaticAnalysis",
		"SecretsManagement",
		"Hardening",
	],
	training: null,
};
