"use client";

import { useRef } from "react";
import {
	type AttachmentMeta,
	MAX_IMAGES,
	validateAttachmentSet,
} from "@/lib/agents/attachments";

export function AttachmentPicker({
	files,
	onFiles,
}: {
	files: AttachmentMeta[];
	onFiles: (next: AttachmentMeta[]) => void;
}) {
	const ref = useRef<HTMLInputElement>(null);

	return (
		<div className="flex items-center gap-2">
			<input
				ref={ref}
				type="file"
				multiple
				accept="image/png,image/jpeg,image/webp,image/gif,text/*,application/json"
				className="hidden"
				onChange={(e) => {
					const next = Array.from(e.target.files ?? []).map((f) => ({
						mediaType: f.type,
						size: f.size,
					}));
					const check = validateAttachmentSet(next);
					if (!check.ok) {
						alert(check.reason);
						if (ref.current) ref.current.value = "";
						return;
					}
					onFiles(next);
				}}
			/>
			<button
				type="button"
				onClick={() => ref.current?.click()}
				className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-2 py-1"
			>
				Joindre
			</button>
			<span className="text-xs text-zinc-500">
				{files.length}/{MAX_IMAGES}
			</span>
		</div>
	);
}
