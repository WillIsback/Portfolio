// Prisma config for Neon PostgreSQL
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
		seed: "npx tsx prisma/seed.ts",
	},
	datasource: {
		// Utiliser DIRECT_URL pour les commandes CLI (migrations, db push)
		url: process.env.DIRECT_URL,
	},
});
