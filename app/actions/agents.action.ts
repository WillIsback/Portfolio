"use server";

import {
	createProject,
	deleteProject,
	updateProject,
} from "@/app/actions/admin.action";
import { loadAdminProject } from "@/lib/admin/load-project";
import { requireAdmin } from "@/lib/agents/auth";
import {
	type ProjectProposal,
	ProjectProposalSchema,
} from "@/lib/agents/proposals";
import { normalizePractices } from "@/lib/practices";
import { AdminProjectSchema } from "@/schemas";

export type ApplyResult = { ok: true } | { ok: false; error: string };

/** Applique une proposition validée. Re-vérifie l'admin et re-valide les données. */
export async function applyProjectProposal(
	raw: ProjectProposal,
): Promise<ApplyResult> {
	if (!(await requireAdmin())) return { ok: false, error: "Non autorisé." };
	const parsed = ProjectProposalSchema.safeParse(raw);
	if (!parsed.success) return { ok: false, error: "Proposition invalide." };
	const p = parsed.data;

	try {
		if (p.action === "delete") {
			await deleteProject(p.projectId as number);
			return { ok: true };
		}

		if (p.action === "create") {
			const data = p.data ?? {};
			const merged = AdminProjectSchema.parse({
				...data,
				...(data.practices
					? { practices: normalizePractices(data.practices) }
					: {}),
			});
			await createProject(merged);
			return { ok: true };
		}

		const current = await loadAdminProject(p.projectId as number);
		if (!current) return { ok: false, error: "Projet introuvable." };
		const data = p.data ?? {};
		const merged = AdminProjectSchema.parse({
			...current,
			...data,
			...(data.practices
				? { practices: normalizePractices(data.practices) }
				: {}),
		});
		await updateProject(p.projectId as number, merged);
		return { ok: true };
	} catch {
		return { ok: false, error: "Écriture impossible." };
	}
}
