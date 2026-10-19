import { ChatPanel } from "@/components/agents/ChatPanel";

export default function ArticlesAgentPage() {
	return (
		<div>
			<h1 className="text-2xl font-bold font-mono mb-6">Agent Articles</h1>
			<ChatPanel api="/api/agents/articles" />
		</div>
	);
}
