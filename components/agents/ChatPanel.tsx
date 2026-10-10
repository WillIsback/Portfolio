"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { filesToDataUrls } from "@/lib/agents/attachments";
import { ProjectProposalSchema } from "@/lib/agents/proposals";
import { AttachmentPicker } from "./AttachmentPicker";
import { ProposalCard } from "./ProposalCard";

export function ChatPanel({ api }: { api: string }) {
	const { messages, sendMessage, status } = useChat({
		transport: new DefaultChatTransport({ api }),
	});
	const [input, setInput] = useState("");
	const [files, setFiles] = useState<File[]>([]);

	return (
		<div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl">
			<div className="flex-1 overflow-auto space-y-4 pr-2">
				{messages.map((m) => (
					<div key={m.id} className="text-sm">
						<p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
							{m.role === "user" ? "Vous" : "Agent"}
						</p>
						{m.parts.map((part, i) => {
							if (part.type === "text")
								return (
									<p key={i} className="whitespace-pre-wrap text-zinc-200">
										{part.text}
									</p>
								);
							if (part.type === "file" && part.mediaType.startsWith("image/"))
								return (
									// biome-ignore lint/performance/noImgElement: aperçu local d'une pièce jointe
									<img
										key={i}
										src={part.url}
										alt={part.filename ?? "pièce jointe"}
										className="max-w-xs rounded border border-zinc-700"
									/>
								);
							if (part.type === "tool-proposeProjectDraft") {
								const out = (part as { output?: unknown }).output;
								const parsed = ProjectProposalSchema.safeParse(out);
								return parsed.success ? (
									<ProposalCard key={i} proposal={parsed.data} />
								) : null;
							}
							return null;
						})}
					</div>
				))}
			</div>
			<form
				className="border-t border-zinc-800 pt-3 flex flex-col gap-2"
				onSubmit={async (e) => {
					e.preventDefault();
					if (!input.trim()) return;
					const fileParts = files.length ? await filesToDataUrls(files) : [];
					sendMessage({
						role: "user",
						parts: [{ type: "text", text: input }, ...fileParts],
					});
					setInput("");
					setFiles([]);
				}}
			>
				<div className="flex items-center justify-between">
					<AttachmentPicker files={files} onFiles={setFiles} />
					{status !== "ready" ? (
						<span className="text-xs text-zinc-500">L'agent réfléchit…</span>
					) : null}
				</div>
				<textarea
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Demander à l'agent…"
					className="w-full resize-none rounded-lg bg-zinc-900 border border-zinc-700 p-3 text-sm text-zinc-100"
					rows={3}
				/>
				<button
					type="submit"
					disabled={status !== "ready"}
					className="self-end text-sm bg-zinc-100 text-zinc-900 rounded-lg px-4 py-2 font-medium disabled:opacity-50"
				>
					Envoyer
				</button>
			</form>
		</div>
	);
}
