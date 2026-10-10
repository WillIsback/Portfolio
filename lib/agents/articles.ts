import { z } from "zod";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const ArticleDraftSchema = z.object({
	slug: z.string().regex(SLUG_RE, "slug invalide"),
	title: z.string().min(1),
	description: z.string().min(1),
	date: z.string().regex(DATE_RE, "date YYYY-MM-DD attendue"),
	tags: z.array(z.string()).default([]),
	status: z.string().optional(),
	period: z.string().optional(),
	projects: z.array(z.number().int().positive()).optional(),
	body: z.string().min(1),
});

export type ArticleDraft = z.infer<typeof ArticleDraftSchema>;

/** Assemble le fichier MDX (frontmatter YAML minimal + corps). */
export function frontmatterToMdx(draft: ArticleDraft): string {
	const lines = [
		"---",
		`title: ${draft.title}`,
		`description: ${draft.description}`,
		`date: ${draft.date}`,
		`tags: [${draft.tags.join(", ")}]`,
	];
	if (draft.status) lines.push(`status: ${draft.status}`);
	if (draft.period) lines.push(`period: ${draft.period}`);
	if (draft.projects?.length)
		lines.push(`projects: [${draft.projects.join(", ")}]`);
	lines.push("---", "", draft.body.trim(), "");
	return lines.join("\n");
}
