import { ChatPanel } from "@/components/agents/ChatPanel";

export default function ProjectsAgentPage() {
	return (
		<div>
			<h1 className="text-2xl font-bold font-mono mb-6">Agent Projets</h1>
			<ChatPanel api="/api/agents/projects" />
		</div>
	);
}
