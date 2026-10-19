"use client";

import FeaturedCard from "@/components/register/FeaturedCard";
import IndexRow from "@/components/register/IndexRow";
import { buildPreviewProject } from "@/lib/admin/project-form";
import type { AdminProject } from "@/schemas";

export function ProjectPreview({
	id,
	form,
}: {
	id: number;
	form: AdminProject;
}) {
	const project = buildPreviewProject(id, form);
	return (
		<section aria-labelledby="preview-title" className="space-y-3">
			<h2 id="preview-title" className="text-sm font-medium text-zinc-300">
				Aperçu sur le site
			</h2>
			<div className="rounded-lg bg-background p-4 text-foreground">
				<div className="max-w-sm">
					<FeaturedCard
						project={project}
						figureNumber={1}
						points={[]}
						neighborIds={[]}
					/>
				</div>
				<ul className="m-0 mt-4 list-none p-0">
					<IndexRow project={project} />
				</ul>
			</div>
		</section>
	);
}
