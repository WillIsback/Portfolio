// app/(admin)/projects/[id]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllArticles } from "@/lib/articles/loader";
import prisma from "@/lib/db";
import type { AdminProject } from "@/schemas";
import { ProjectEditForm } from "./ProjectEditForm";

export default async function EditProjectPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const project = await prisma.project.findUnique({
		where: { id: Number(id) },
		include: {
			languages: true,
			databases: true,
			backends: true,
			frontends: true,
			devops: true,
			domains: true,
			mlStack: true,
			practices: true,
		},
	});

	if (!project) notFound();

	const articles = getAllArticles()
		.filter((a) => a.projects?.includes(project.id))
		.map((a) => ({ slug: a.slug, title: a.title }));

	const initial: AdminProject = {
		title: project.title,
		description: project.description,
		imagePath: project.imagePath ?? "",
		github: project.github ?? "",
		lastUpdate: project.lastUpdate?.toISOString() ?? "",
		isPrivate: project.isPrivate,
		isAiGenerated: project.isAiGenerated,
		languages: project.languages.map((l) => l.language),
		databases: project.databases.map((d) => d.database),
		backends: project.backends.map((b) => b.backend),
		frontends: project.frontends.map((f) => f.frontend),
		devops: project.devops.map((d) => d.devops),
		domains: project.domains.map((d) => d.domain),
		mlStack: project.mlStack.map((m) => m.ml),
		pitch: project.pitch ?? undefined,
		status: project.status ?? undefined,
		period: project.period ?? undefined,
		githubRepoId: project.githubRepoId ?? undefined,
		featuredRank: project.featuredRank ?? undefined,
		practices: project.practices.map((p) => p.practice),
		training: project.training ?? null,
	};

	return (
		<div className="max-w-3xl">
			<div className="flex items-center gap-3 mb-8">
				<Link
					href="/admin/projects"
					className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
				>
					← Projects
				</Link>
				<span className="text-zinc-700">/</span>
				<h1 className="text-xl font-bold font-mono">{project.title}</h1>
			</div>
			<ProjectEditForm id={project.id} initial={initial} articles={articles} />
		</div>
	);
}
