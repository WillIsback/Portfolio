// app/(admin)/projects/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db";
import { ProjectEditForm } from "./ProjectEditForm";
import type { AdminProject } from "@/schemas";

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
    },
  });

  if (!project) notFound();

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
  };

  return (
    <div className="max-w-2xl">
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
      <ProjectEditForm id={project.id} initial={initial} />
    </div>
  );
}
