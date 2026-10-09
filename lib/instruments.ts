export interface Instrument {
	id: "data-ml" | "backend" | "frontend" | "devops";
	title: string;
	tools: { name: string; icon?: string }[];
	libraries: string[];
	utilities: string[];
}

export const INSTRUMENTS: Instrument[] = [
	{
		id: "data-ml",
		title: "Data & ML",
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
		title: "Back-end & API",
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
		title: "Front-end",
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
		title: "DevOps & outils",
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
