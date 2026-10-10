import {
	convertToModelMessages,
	createUIMessageStreamResponse,
	isStepCount,
	type JSONValue,
	streamText,
	toUIMessageStream,
	type UIMessage,
} from "ai";
import { auth } from "@/auth";
import { resolveModelId } from "@/lib/agents/model";
import { vllmProvider } from "@/lib/agents/provider";
import { requestOptions } from "@/lib/agents/reasoning";
import { projectTools } from "@/lib/agents/tools/projects.tools";

export const maxDuration = 300;

const SYSTEM = `Tu es l'assistant de gestion des projets du portfolio de William Derue.
Tu aides à lire, analyser (dépôt GitHub) et rédiger les fiches projets.
RÈGLE ABSOLUE : tu ne modifies JAMAIS la base. Pour toute écriture, appelle
proposeProjectDraft avec une proposition structurée ; l'humain validera dans l'interface.
Réponds en français, de façon concise.`;

export async function POST(req: Request) {
	const session = await auth();
	if (session?.user?.githubId !== process.env.ADMIN_GITHUB_ID)
		return new Response("Unauthorized", { status: 401 });

	const { messages }: { messages: UIMessage[] } = await req.json();
	const modelId = await resolveModelId();
	const { providerOptions, ...sampling } = requestOptions("chat");

	const result = streamText({
		model: vllmProvider()(modelId),
		system: SYSTEM,
		messages: await convertToModelMessages(messages),
		tools: projectTools,
		stopWhen: isStepCount(6),
		...sampling,
		providerOptions: providerOptions as {
			vllm: Record<string, JSONValue>;
		},
	});

	return createUIMessageStreamResponse({
		stream: toUIMessageStream({ stream: result.stream }),
	});
}
