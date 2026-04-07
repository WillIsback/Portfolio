// app/(admin)/projects/page.tsx
import Link from "next/link";
import prisma from "@/lib/db";
import { DeleteProjectButton } from "./DeleteProjectButton";

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      github: true,
      updatedAt: true,
      languages: { select: { language: true } },
    },
  });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold font-mono">Projects</h1>
        <span className="text-sm text-zinc-500">{projects.length} total</span>
      </div>

      <div className="space-y-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">
                {project.title}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">
                {project.languages.map((l) => l.language).join(", ") || "—"} ·{" "}
                {project.updatedAt.toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <Link
                href={`/admin/projects/${project.id}`}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Edit
              </Link>
              <DeleteProjectButton id={project.id} title={project.title} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
