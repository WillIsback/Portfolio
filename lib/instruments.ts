import type { Translator } from "@/i18n/translator";

export type InstrumentId = "data-ml" | "backend" | "frontend" | "devops";

export interface Instrument {
	id: InstrumentId;
	tools: { name: string; icon?: string }[];
	libraries: string[];
	utilities: string[];
}

/**
 * Titre d'une ligne d'instruments, traduit à la demande.
 *
 * Seuls ces quatre titres voyagent dans le dictionnaire : les outils, bibliothèques et
 * utilitaires sont des noms de marque, écrits pareil dans les trois langues.
 */
export function instrumentTitle(t: Translator, id: InstrumentId): string {
	return t(id);
}

export const INSTRUMENTS: Instrument[] = [
	{
		id: "data-ml",
		tools: [
			{ name: "Python", icon: "/icon/Python.svg" },
			{ name: "PostgreSQL", icon: "/icon/Postgresql.svg" },
			{ name: "MongoDB", icon: "/icon/Mongodb.svg" },
			{ name: "Informix", icon: "/icon/Informix.svg" },
		],
		libraries: [
			"PyTorch",
			"Transformers",
			"Scikit-learn",
			"pgvector",
			"Faiss",
			"SQLAlchemy",
			"Prisma",
			"Drizzle",
			"Mongoose",
			"ElectricSQL",
			"TanStack DB",
		],
		utilities: ["lite-cli", "Data Wrangler"],
	},
	{
		id: "backend",
		tools: [
			{ name: "FastAPI", icon: "/icon/FastApi.svg" },
			{ name: "Fastify", icon: "/icon/Fastify.svg" },
			{ name: "Express.js", icon: "/icon/Expressjs.svg" },
			{ name: "TypeScript", icon: "/icon/Typescript.svg" },
		],
		libraries: [
			"Uvicorn",
			"Bun",
			"Pytest",
			"Playwright",
			"Zod",
			"Swagger / OpenAPI",
			"JOSE",
			"MkDocs",
			"Psycopg",
			"Ruff",
			"uv",
		],
		utilities: ["Postman", "WebDevTools"],
	},
	{
		id: "frontend",
		tools: [
			{ name: "React", icon: "/icon/React.svg" },
			{ name: "Next.js", icon: "/icon/Nextjs.svg" },
			{ name: "TanStack", icon: "/icon/Tanstack.svg" },
			{ name: "Svelte", icon: "/icon/Svelte.svg" },
			{ name: "Vite", icon: "/icon/Vite.svg" },
		],
		libraries: [
			"NextAuth",
			"Biome",
			"Lucide React",
			"shadcn/ui",
			"DOMPurify",
			"date-fns",
			"TailwindCSS",
			"DaisyUI",
			"TSDoc",
		],
		utilities: ["Wave", "Playwright", "WebDevTools"],
	},
	{
		id: "devops",
		tools: [
			{ name: "Docker", icon: "/icon/Docker.svg" },
			{ name: "GitHub Actions", icon: "/icon/Github.svg" },
		],
		libraries: [
			"Pytest",
			"Vitest",
			"pre-commit",
			"git-cliff",
			"standard-version",
		],
		utilities: [
			"Wave",
			"Playwright",
			"lazy-docker",
			"docker-compose",
			"Portainer",
		],
	},
];
