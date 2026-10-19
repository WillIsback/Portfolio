// app/(admin)/projects/DeleteProjectButton.tsx
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteProject } from "@/app/actions/admin.action";

export function DeleteProjectButton({
	id,
	title,
}: {
	id: number;
	title: string;
}) {
	const [isPending, startTransition] = useTransition();

	function handleDelete() {
		if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
		startTransition(async () => {
			try {
				await deleteProject(id);
				toast.success(`"${title}" deleted`);
			} catch {
				toast.error("Delete failed");
			}
		});
	}

	return (
		<button
			type="button"
			onClick={handleDelete}
			disabled={isPending}
			className="text-xs text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
		>
			{isPending ? "Deleting…" : "Delete"}
		</button>
	);
}
