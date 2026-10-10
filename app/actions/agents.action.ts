"use server";

import { getRun, start } from "workflow/api";
import {
	createProject,
	deleteProject,
	updateProject,
} from "@/app/actions/admin.action";
import {
	type ArticleBrief,
	articleWorkflow,
} from "@/app/workflows/article.workflow";
import { loadAdminProject } from "@/lib/admin/load-project";
import type { ArticleDraft } from "@/lib/agents/articles";
import { requireAdmin } from "@/lib/agents/auth";
import { type ArticlePrResult, createArticlePr } from "@/lib/agents/github-pr";
import {
	type ProjectProposal,
	ProjectProposalSchema,
} from "@/lib/agents/proposals";
import { normalizePractices } from "@/lib/practices";
import { AdminProjectSchema } from "@/schemas";

const PORTFOLIO_REPO = "WillIsback/portfolio";
const BASE_BRANCH = "main";

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

export async function startArticleWorkflow(
	brief: ArticleBrief,
): Promise<{ ok: true; runId: string } | { ok: false; error: string }> {
	if (!(await requireAdmin())) return { ok: false, error: "Non autorisé." };
	try {
		const run = await start(articleWorkflow, [brief]);
		return { ok: true, runId: run.runId };
	} catch {
		return { ok: false, error: "Démarrage de la génération impossible." };
	}
}

export async function openArticlePr(input: {
	slug: string;
	mdx: string;
	title: string;
	body: string;
}): Promise<ArticlePrResult> {
	if (!(await requireAdmin())) return { ok: false, error: "Non autorisé." };
	return createArticlePr(
		{ ...input, branch: `agent/article-${input.slug}` },
		{
			token: process.env.GITHUB_TOKEN,
			repo: PORTFOLIO_REPO,
			baseBranch: BASE_BRANCH,
		},
	);
}

export type ArticleRunResult =
	| { ok: true; status: string; draft: ArticleDraft | null }
	| { ok: false; error: string };

/** Statut d'un run de génération d'article ; renvoie le brouillon s'il est terminé. */
export async function getArticleRun(runId: string): Promise<ArticleRunResult> {
	if (!(await requireAdmin())) return { ok: false, error: "Non autorisé." };
	try {
		const run = getRun<ArticleDraft>(runId);
		const status = await run.status;
		if (status === "completed")
			return { ok: true, status, draft: await run.returnValue };
		if (status === "failed") return { ok: false, error: "Génération échouée." };
		if (status === "cancelled")
			return { ok: false, error: "Génération annulée." };
		return { ok: true, status, draft: null };
	} catch {
		return { ok: false, error: "Run introuvable." };
	}
}
