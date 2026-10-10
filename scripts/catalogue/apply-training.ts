import { INITIAL_TRAINING } from "../../lib/catalogue/initial-training";
import { prisma } from "../../lib/db";

async function main() {
	if (!process.env.DATABASE_URL) {
		throw new Error(
			"DATABASE_URL manquante : lancer via `pnpm catalogue:training`.",
		);
	}
	const apply = process.argv.includes("--apply");
	const ids = Object.keys(INITIAL_TRAINING).map(Number);
	const projects = await prisma.project.findMany({
		where: { id: { in: ids } },
		select: { id: true, title: true, training: true },
		orderBy: { id: "asc" },
	});
	const found = new Set(projects.map((p) => p.id));
	const missing = ids.filter((id) => !found.has(id));
	if (missing.length > 0) {
		throw new Error(`Projets absents de la base : ${missing.join(", ")}.`);
	}
	for (const p of projects)
		console.log(
			`#${p.id} ${p.title} : ${p.training ?? "-"} -> ${INITIAL_TRAINING[p.id]}`,
		);
	if (!apply) {
		console.log(
			"\nEssai à blanc : rien n'a été écrit (--apply pour appliquer).",
		);
		return;
	}
	await prisma.$transaction(
		ids.map((id) =>
			prisma.project.update({
				where: { id },
				data: { training: INITIAL_TRAINING[id] },
			}),
		),
	);
	console.log(`\n${ids.length} projets rattachés à un parcours.`);
}

main()
	.catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
