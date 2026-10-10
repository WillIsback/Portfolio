import { generateText } from "ai";
import { z } from "zod";
import { type ArticleDraft, ArticleDraftSchema } from "@/lib/agents/articles";
import { resolveModelId } from "@/lib/agents/model";
import { vllmProvider } from "@/lib/agents/provider";
import { requestOptions } from "@/lib/agents/reasoning";

export const planSchema = z.object({
	sections: z
		.array(z.object({ heading: z.string(), brief: z.string() }))
		.min(1)
		.max(8),
});

export interface ArticleBrief {
	slug: string;
	title: string;
	description: string;
	tags: string[];
	projects?: number[];
	notes: string;
}

export function buildSections(
	sections: { heading: string; brief: string }[],
): string[] {
	return sections.map((s) => s.heading);
}

async function model() {
	return vllmProvider()(await resolveModelId());
}

export async function planArticle(brief: ArticleBrief) {
	"use step";
	const opts = requestOptions("generation");
	const { text } = await generateText({
		model: await model(),
		system:
			'Tu planifies un article de blog technique en français (style carnet de labo). Réponds UNIQUEMENT en JSON: {"sections":[{"heading":"...","brief":"..."}]}.',
		prompt: `Titre: ${brief.title}\nDescription: ${brief.description}\nNotes: ${brief.notes}`,
		...opts,
	});
	return planSchema.parse(JSON.parse(text));
}

export async function writeSection(args: {
	brief: ArticleBrief;
	plan: z.infer<typeof planSchema>;
	section: { heading: string; brief: string };
}) {
	"use step";
	const opts = requestOptions("generation");
	const { text } = await generateText({
		model: await model(),
		system:
			"Tu rédiges une section d'article technique en français, en Markdown, sans le titre de section.",
		prompt: `Article: ${args.brief.title}\nPlan: ${buildSections(args.plan.sections).join(" > ")}\nSection: ${args.section.heading}\nConsigne: ${args.section.brief}`,
		...opts,
	});
	return { heading: args.section.heading, body: text.trim() };
}

export async function assembleArticle(args: {
	brief: ArticleBrief;
	sections: { heading: string; body: string }[];
}): Promise<ArticleDraft> {
	"use step";
	const body = args.sections
		.map((s) => `## ${s.heading}\n\n${s.body}`)
		.join("\n\n");
	return ArticleDraftSchema.parse({
		slug: args.brief.slug,
		title: args.brief.title,
		description: args.brief.description,
		date: new Date().toISOString().slice(0, 10),
		tags: args.brief.tags,
		status: "brouillon",
		projects: args.brief.projects,
		body,
	});
}

/** Génère un brouillon d'article : plan → sections (1 step/section) → assemblage. */
export async function articleWorkflow(
	brief: ArticleBrief,
): Promise<ArticleDraft> {
	"use workflow";
	const plan = await planArticle(brief);
	const sections: { heading: string; body: string }[] = [];
	for (const section of plan.sections)
		sections.push(await writeSection({ brief, plan, section }));
	return assembleArticle({ brief, sections });
}
