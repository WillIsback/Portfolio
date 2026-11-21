import {
	createProject,
	pendingCreations,
} from "../../lib/catalogue/create-projects";
import {
	NEW_OC_PROJECTS,
	OC_TITLE_RENAMES,
} from "../../lib/catalogue/oc-naming";
import { prisma } from "../../lib/db";

/**
 * Applique la convention `OC-{Parcours}-{numéro}-{Nom}` : renomme les fiches OC
 * existantes et crée celles des dépôts OC absents. Essai à blanc par défaut,
 * `--apply` pour écrire. Relançable : ce qui est déjà fait est ignoré.
 */
async function main() {
	if (!process.env.DATABASE_URL) {
		throw new Error(
			"DATABASE_URL manquante : lancer via `pnpm catalogue:oc-naming`.",
		);
	}
	const apply = process.argv.includes("--apply");

	const renames: { id: number; to: string }[] = [];
	for (const [key, { from, to }] of Object.entries(OC_TITLE_RENAMES)) {
		const id = Number(key);
		const current = await prisma.project.findUnique({
			where: { id },
			select: { title: true },
		});
		if (!current) throw new Error(`Projet ${id} absent de la base.`);
		if (current.title === to) {
			console.log(`#${id} déjà renommé : ${to}`);
			continue;
		}
		if (current.title !== from) {
			throw new Error(
				`Le projet ${id} s'appelle « ${current.title} », pas « ${from} ».`,
			);
		}
		console.log(`#${id} ${from}\n    -> ${to}`);
		renames.push({ id, to });
	}

	const creations = await pendingCreations(prisma, NEW_OC_PROJECTS);

	if (!apply) {
		console.log(
			`\nEssai à blanc : ${renames.length} renommage(s), ${creations.length} création(s), rien n'a été écrit (--apply pour appliquer).`,
		);
		return;
	}

	await prisma.$transaction(async (tx) => {
		for (const { id, to } of renames) {
			await tx.project.update({ where: { id }, data: { title: to } });
		}
		for (const data of creations) {
			const created = await createProject(tx, data);
			console.log(`créée : #${created.id} ${data.title}`);
		}
	});
	console.log(
		"\nBase mise à jour. Régénérer la carte du carnet (`pnpm embeddings`) ; le cache « projects » du site se vide au prochain déploiement.",
	);
}

main()
	.catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
