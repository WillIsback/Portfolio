import {
	createProject,
	pendingCreations,
} from "../../lib/catalogue/create-projects";
import { GRAMMARIA_PROJECTS } from "../../lib/catalogue/grammaria-projects";
import { prisma } from "../../lib/db";

/** Crée les fiches Grammaria et grammaria-rc. Essai à blanc par défaut, `--apply` pour écrire. */
async function main() {
	if (!process.env.DATABASE_URL) {
		throw new Error(
			"DATABASE_URL manquante : lancer via `pnpm catalogue:grammaria`.",
		);
	}
	const creations = await pendingCreations(prisma, GRAMMARIA_PROJECTS);
	if (!process.argv.includes("--apply")) {
		console.log(
			`\nEssai à blanc : ${creations.length} création(s), rien n'a été écrit (--apply pour appliquer).`,
		);
		return;
	}
	await prisma.$transaction(async (tx) => {
		for (const data of creations) {
			const created = await createProject(tx, data);
			console.log(`créée : #${created.id} ${data.title}`);
		}
	});
	console.log(
		"\nBase mise à jour. Régénérer la carte du carnet (`pnpm embeddings`).",
	);
}

main()
	.catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
