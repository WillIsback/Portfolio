// app/(admin)/projects/page.tsx
import Link from "next/link";
import { needsCompletion } from "@/lib/admin/project-form";
import prisma from "@/lib/db";
import { DOMAIN_LABELS } from "@/lib/domains";
import { PROJECT_STATUSES, STATUS_LABELS } from "@/lib/status";
import { DeleteProjectButton } from "./DeleteProjectButton";

const dash = "—";

export default async function AdminProjectsPage({
	searchParams,
}: {
	searchParams?: Promise<{ filtre?: string }>;
}) {
	const incompleteOnly = (await searchParams)?.filtre === "a-completer";
	const all = await prisma.project.findMany({
		orderBy: { updatedAt: "desc" },
		select: {
			id: true,
			title: true,
			pitch: true,
			status: true,
			featuredRank: true,
			syncedAt: true,
			domains: { select: { domain: true } },
		},
	});
	const projects = incompleteOnly
		? all.filter((p) =>
				needsCompletion({ pitch: p.pitch, domainCount: p.domains.length }),
			)
		: all;
	const statusLabel = (s: string | null) =>
		(PROJECT_STATUSES as readonly string[]).includes(s ?? "")
			? STATUS_LABELS[s as (typeof PROJECT_STATUSES)[number]]
			: dash;

	return (
		<div className="max-w-5xl">
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-2xl font-bold font-mono">Projects</h1>
				<span className="text-sm text-zinc-500">
					{projects.length} {incompleteOnly ? `sur ${all.length}` : "total"}
				</span>
			</div>

			<nav aria-label="Filtre" className="mb-6 flex gap-3 text-sm">
				<Link
					href="/admin/projects"
					aria-current={incompleteOnly ? undefined : "page"}
					className={incompleteOnly ? "text-zinc-500" : "text-zinc-100"}
				>
					Tous
				</Link>
				<Link
					href="/admin/projects?filtre=a-completer"
					aria-current={incompleteOnly ? "page" : undefined}
					className={incompleteOnly ? "text-zinc-100" : "text-zinc-500"}
				>
					À compléter
				</Link>
			</nav>

			<table className="w-full text-left text-sm">
				<caption className="sr-only">Projets</caption>
				<thead className="text-xs text-zinc-500">
					<tr>
						<th scope="col" className="py-2 pr-3 font-normal">
							Titre
						</th>
						<th scope="col" className="py-2 pr-3 font-normal">
							Statut
						</th>
						<th scope="col" className="py-2 pr-3 font-normal">
							Domaines
						</th>
						<th scope="col" className="py-2 pr-3 font-normal">
							Rang phare
						</th>
						<th scope="col" className="py-2 pr-3 font-normal">
							Synchronisé
						</th>
						<th scope="col" className="py-2 font-normal">
							<span className="sr-only">Actions</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{projects.map((project) => (
						<tr key={project.id} className="border-t border-zinc-800">
							<td className="py-3 pr-3 font-medium text-zinc-200">
								{project.title}
							</td>
							<td className="py-3 pr-3 text-zinc-400">
								{statusLabel(project.status)}
							</td>
							<td className="py-3 pr-3 text-zinc-400">
								{project.domains
									.map(
										(d) =>
											DOMAIN_LABELS[d.domain as keyof typeof DOMAIN_LABELS] ??
											d.domain,
									)
									.join(", ") || dash}
							</td>
							<td className="py-3 pr-3 text-zinc-400">
								{project.featuredRank ?? dash}
							</td>
							<td className="py-3 pr-3 text-zinc-400">
								{project.syncedAt?.toLocaleDateString("fr-FR") ?? dash}
							</td>
							<td className="py-3">
								<div className="flex items-center justify-end gap-4">
									<Link
										href={`/admin/projects/${project.id}`}
										className="text-xs text-zinc-400 hover:text-white transition-colors"
									>
										Edit
									</Link>
									<DeleteProjectButton id={project.id} title={project.title} />
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
