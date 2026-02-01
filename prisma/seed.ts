import { resolve } from "node:path";
import { config } from "dotenv";

// Charger .env.local en priorité (variables Neon de Vercel), puis .env comme fallback
config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

import { PrismaNeon } from "@prisma/adapter-neon";
import githubProjects from "../app/data/github-projects.json";
import { PrismaClient } from "./generated/prisma/client";

// Construire la connection string à partir des variables individuelles si DATABASE_URL n'est pas définie
const connectionString =
	process.env.DATABASE_URL ||
	`postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}/${process.env.PGDATABASE}?sslmode=require`;

if (!connectionString || connectionString.includes("undefined")) {
	throw new Error(
		"Database connection not configured. Check .env.local or .env",
	);
}

console.log("Connecting to:", connectionString.replace(/:[^:@]+@/, ":***@"));

// Utiliser PrismaNeon avec connectionString directement
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

// Types pour les enums
type Language = "Python" | "TypeScript" | "JavaScript" | "Rust";
type Database = "Postgresql" | "MongoDB" | "Informix" | "SQLite";
type BackendApi = "FastAPI" | "Fastify" | "ExpressJs";
type Frontend = "React" | "NextJs" | "Tanstack" | "Svelte" | "SvelteKit";
type DevOps = "Docker" | "GithubActions";

interface ProjectInput {
	title: string;
	description: string;
	github?: string;
	imagePath?: string;
	lastUpdate?: string;
	isPrivate?: boolean;
	isAiGenerated?: boolean;
	languages?: Language[];
	techStack?: {
		database?: Database[];
		backendApi?: BackendApi[];
		frontend?: Frontend[];
		devOps?: DevOps[];
	};
}

async function main() {
	console.log("🌱 Seeding database from GitHub projects...");

	// Nettoyer la base
	await prisma.projectDevOps.deleteMany();
	await prisma.projectFrontend.deleteMany();
	await prisma.projectBackend.deleteMany();
	await prisma.projectDatabase.deleteMany();
	await prisma.projectLanguage.deleteMany();
	await prisma.project.deleteMany();

	console.log("🧹 Database cleaned");

	const projects = githubProjects.projects as ProjectInput[];

	for (const projectData of projects) {
		const project = await prisma.project.create({
			data: {
				title: projectData.title,
				description: projectData.description,
				imagePath: projectData.imagePath,
				github: projectData.github || "",
				lastUpdate: projectData.lastUpdate
					? new Date(projectData.lastUpdate)
					: null,
				isPrivate: projectData.isPrivate ?? false,
				isAiGenerated: projectData.isAiGenerated ?? false,
			},
		});

		// Ajouter les langages
		if (projectData.languages && projectData.languages.length > 0) {
			for (const lang of projectData.languages) {
				await prisma.projectLanguage.create({
					data: {
						projectId: project.id,
						language: lang,
					},
				});
			}
		}

		// Ajouter les databases
		if (
			projectData.techStack?.database &&
			projectData.techStack.database.length > 0
		) {
			for (const db of projectData.techStack.database) {
				await prisma.projectDatabase.create({
					data: {
						projectId: project.id,
						database: db,
					},
				});
			}
		}

		// Ajouter les backends
		if (
			projectData.techStack?.backendApi &&
			projectData.techStack.backendApi.length > 0
		) {
			for (const backend of projectData.techStack.backendApi) {
				await prisma.projectBackend.create({
					data: {
						projectId: project.id,
						backend: backend,
					},
				});
			}
		}

		// Ajouter les frontends
		if (
			projectData.techStack?.frontend &&
			projectData.techStack.frontend.length > 0
		) {
			for (const frontend of projectData.techStack.frontend) {
				await prisma.projectFrontend.create({
					data: {
						projectId: project.id,
						frontend: frontend,
					},
				});
			}
		}

		// Ajouter les devops
		if (
			projectData.techStack?.devOps &&
			projectData.techStack.devOps.length > 0
		) {
			for (const devop of projectData.techStack.devOps) {
				await prisma.projectDevOps.create({
					data: {
						projectId: project.id,
						devops: devop,
					},
				});
			}
		}

		console.log(`✅ Created: ${projectData.title}`);
	}

	console.log(`\n🎉 Seeded ${projects.length} projects from GitHub!`);
}

main()
	.catch((e) => {
		console.error("❌ Seed error:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
