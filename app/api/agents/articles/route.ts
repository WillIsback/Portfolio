import {
	convertToModelMessages,
	createUIMessageStreamResponse,
	isStepCount,
	streamText,
	tool,
	toUIMessageStream,
	type UIMessage,
} from "ai";
import { z } from "zod";
import { startArticleWorkflow } from "@/app/actions/agents.action";
import { requireAdmin } from "@/lib/agents/auth";
import { resolveModelId } from "@/lib/agents/model";
import { vllmProvider } from "@/lib/agents/provider";
import { requestOptions } from "@/lib/agents/reasoning";
import { articleTools } from "@/lib/agents/tools/articles.tools";

export const maxDuration = 300;

const SYSTEM = `Tu es l'assistant de gestion des articles du portfolio de William Derue.
Tu aides à lire, relire et rédiger des articles MDX (style carnet de labo, en français).
Pour rédiger un article, appelle generateArticleDraft (génération en tâche de fond) : l'humain relira l'aperçu puis publiera via une Pull Request.
Tu ne publies JAMAIS toi-même. Réponds de façon concise.`;

const generateArticleDraft = tool({
	description:
		"Lance en tâche de fond la génération d'un brouillon d'article (plan + sections). Renvoie un runId à suivre dans l'interface ; l'humain validera avant toute publication.",
	inputSchema: z.object({
		slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
		title: z.string().min(1),
		description: z.string().min(1),
		tags: z.array(z.string()).default([]),
		projects: z.array(z.number().int().positive()).optional(),
		notes: z.string().min(1),
	}),
	execute: async (brief) => startArticleWorkflow(brief),
});

export async function POST(req: Request) {
	if (!(await requireAdmin()))
		return new Response("Unauthorized", { status: 401 });

	const body = (await req.json().catch(() => null)) as {
		messages?: unknown;
	} | null;
	if (!body || !Array.isArray(body.messages))
		return new Response("Bad Request", { status: 400 });
	const messages = body.messages as UIMessage[];
	const modelId = await resolveModelId();
	const opts = requestOptions("chat");

	const result = streamText({
		model: vllmProvider()(modelId),
		system: SYSTEM,
		messages: await convertToModelMessages(messages),
		tools: { ...articleTools, generateArticleDraft },
		stopWhen: isStepCount(6),
		abortSignal: req.signal,
		...opts,
	});

	return createUIMessageStreamResponse({
		stream: toUIMessageStream({ stream: result.stream }),
	});
}
