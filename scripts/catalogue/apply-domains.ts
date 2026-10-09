import { INITIAL_DOMAINS } from "../../lib/catalogue/initial-domains";
import { prisma } from "../../lib/db";
import { buildDomainRows } from "../../lib/domains";

async function main() {
	if (!process.env.DATABASE_URL) {
		throw new Error(
			"DATABASE_URL manquante : lancer via `pnpm catalogue:domains`.",
		);
	}
	const apply = process.argv.includes("--apply");
	const ids = Object.keys(INITIAL_DOMAINS).map(Number);

	const projects = await prisma.project.findMany({
		select: {
			id: true,
			title: true,
			domains: { select: { domain: true } },
		},
		orderBy: { id: "asc" },
	});
	const byId = new Map(projects.map((p) => [p.id, p]));

	const missing = ids.filter((id) => !byId.has(id));
	if (missing.length > 0) {
		throw new Error(`Projets absents de la base : ${missing.join(", ")}.`);
	}

	for (const id of ids) {
		const project = byId.get(id);
		if (!project) continue;
		const current = project.domains.map((d) => d.domain).join(", ") || "-";
		const target = INITIAL_DOMAINS[id].join(", ");
		console.log(`#${id} ${project.title} : ${current} -> ${target}`);
	}

	if (!apply) {
		console.log(
			"\nEssai à blanc : rien n'a été écrit (--apply pour appliquer).",
		);
		return;
	}

	await prisma.$transaction(
		ids.flatMap((id) => [
			prisma.projectDomain.deleteMany({ where: { projectId: id } }),
			prisma.projectDomain.createMany({
				data: buildDomainRows(id, INITIAL_DOMAINS[id]),
			}),
		]),
	);
	console.log(`\n${ids.length} projets étiquetés.`);
}

main()
	.catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
