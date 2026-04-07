// app/actions/admin.action.ts
"use server";

import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import prisma from "@/lib/db";
import { AdminProjectSchema, type AdminProject } from "@/schemas";

async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (
    !session?.user ||
    session.user.githubId !== process.env.ADMIN_GITHUB_ID
  ) {
    throw new Error("Unauthorized");
  }
}

async function upsertProjectRelations(
  // biome-ignore lint/suspicious/noExplicitAny: Prisma transaction client type extraction is complex
  tx: any,
  projectId: number,
  data: AdminProject,
): Promise<void> {
  await tx.projectLanguage.deleteMany({ where: { projectId } });
  await tx.projectDatabase.deleteMany({ where: { projectId } });
  await tx.projectBackend.deleteMany({ where: { projectId } });
  await tx.projectFrontend.deleteMany({ where: { projectId } });
  await tx.projectDevOps.deleteMany({ where: { projectId } });

  if (data.languages.length > 0) {
    await tx.projectLanguage.createMany({
      data: data.languages.map((language) => ({ projectId, language })),
    });
  }
  if (data.databases.length > 0) {
    await tx.projectDatabase.createMany({
      data: data.databases.map((database) => ({ projectId, database })),
    });
  }
  if (data.backends.length > 0) {
    await tx.projectBackend.createMany({
      data: data.backends.map((backend) => ({ projectId, backend })),
    });
  }
  if (data.frontends.length > 0) {
    await tx.projectFrontend.createMany({
      data: data.frontends.map((frontend) => ({ projectId, frontend })),
    });
  }
  if (data.devops.length > 0) {
    await tx.projectDevOps.createMany({
      data: data.devops.map((devops) => ({ projectId, devops })),
    });
  }
}

export async function createProject(raw: AdminProject): Promise<void> {
  await requireAdmin();
  const data = AdminProjectSchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        title: data.title,
        description: data.description,
        imagePath: data.imagePath ?? null,
        github: data.github ?? "",
        lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : null,
        isPrivate: data.isPrivate,
        isAiGenerated: data.isAiGenerated,
      },
    });
    await upsertProjectRelations(tx, project.id, data);
  });

  revalidateTag("projects");
}

export async function updateProject(
  id: number,
  raw: AdminProject,
): Promise<void> {
  await requireAdmin();
  const data = AdminProjectSchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        imagePath: data.imagePath ?? null,
        github: data.github ?? "",
        lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : null,
        isPrivate: data.isPrivate,
        isAiGenerated: data.isAiGenerated,
      },
    });
    await upsertProjectRelations(tx, id, data);
  });

  revalidateTag("projects");
}

export async function deleteProject(id: number): Promise<void> {
  await requireAdmin();
  await prisma.project.delete({ where: { id } });
  revalidateTag("projects");
}

export async function importFromGitHub(projects: AdminProject[]): Promise<void> {
  await requireAdmin();
  const validated = projects.map((p) => AdminProjectSchema.parse(p));

  for (const data of validated) {
    const existing = data.github
      ? await prisma.project.findFirst({ where: { github: data.github } })
      : null;

    if (existing) {
      await updateProject(existing.id, data);
    } else {
      await createProject(data);
    }
  }
}
