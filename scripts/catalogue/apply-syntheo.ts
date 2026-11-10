import { upsertProjectRelations } from "../../lib/admin/project-relations";
import {
	SYNTHEO_PROJECT,
	SYNTHEO_PROJECT_ID,
} from "../../lib/catalogue/syntheo-project";
import { prisma } from "../../lib/db";
import { AdminProjectSchema } from "../../schemas";

const RELATIONS = {
	languages: "language",
	databases: "database",
	backends: "backend",
	frontends: "frontend",
	devops: "devops",
	domains: "domain",
	mlStack: "ml",
	practices: "practice",
} as const;

const SCALARS = [
	"title",
	"pitch",
	"description",
	"github",
	"status",
	"githubRepoId",
	"featuredRank",
	"lastUpdate",
] as const;

function show(value: unknown): string {
	if (value instanceof Date) return value.toISOString();
	if (value === null || value === undefined || value === "") return "-";
	return String(value);
}

async function main() {
	if (!process.env.DATABASE_URL) {
		throw new Error(
			"DATABASE_URL manquante : lancer via `pnpm catalogue:syntheo`.",
		);
	}
	const apply = process.argv.includes("--apply");
	const data = AdminProjectSchema.parse(SYNTHEO_PROJECT);
	const id = SYNTHEO_PROJECT_ID;

	const current = await prisma.project.findUnique({
		where: { id },
		include: {
			languages: true,
			databases: true,
			backends: true,
			frontends: true,
			devops: true,
			domains: true,
			mlStack: true,
			practices: true,
		},
	});
	if (!current) throw new Error(`Projet ${id} absent de la base.`);
	if (current.title !== data.title) {
		throw new Error(
			`Le projet ${id} s'appelle « ${current.title} », pas « ${data.title} ».`,
		);
	}

	console.log(`#${id} ${current.title}`);
	for (const key of SCALARS) {
		const before = show(current[key]);
		const after = show(
			key === "lastUpdate" && data.lastUpdate
				? new Date(data.lastUpdate)
				: data[key],
		);
		if (before !== after) console.log(`  ${key} : ${before}\n    -> ${after}`);
	}
	for (const [key, field] of Object.entries(RELATIONS)) {
		const rows = current[key as keyof typeof RELATIONS] as Record<
			string,
			unknown
		>[];
		const before = rows.map((r) => String(r[field])).join(", ") || "-";
		const after =
			(data[key as keyof typeof RELATIONS] as string[]).join(", ") || "-";
		if (before !== after) console.log(`  ${key} : ${before} -> ${after}`);
	}

	if (!apply) {
		console.log(
			"\nEssai à blanc : rien n'a été écrit (--apply pour appliquer).",
		);
		return;
	}

	await prisma.$transaction(async (tx) => {
		await tx.project.update({
			where: { id },
			data: {
				title: data.title,
				description: data.description,
				imagePath: data.imagePath ?? null,
				github: data.github ?? "",
				lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : null,
				isPrivate: data.isPrivate,
				isAiGenerated: data.isAiGenerated,
				pitch: data.pitch ?? null,
				status: data.status ?? null,
				period: data.period ?? null,
				githubRepoId: data.githubRepoId ?? null,
				featuredRank: data.featuredRank ?? null,
				training: data.training ?? null,
			},
		});
		await upsertProjectRelations(tx, id, data);
	});
	console.log(
		"\nFiche mise à jour. Le cache « projects » du site se vide au prochain déploiement ou à l'enregistrement de la fiche dans l'admin.",
	);
}

main()
	.catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
