// app/(admin)/dashboard/page.tsx
import Link from "next/link";
import prisma from "@/lib/db";

export default async function AdminDashboardPage() {
	const projectCount = await prisma.project.count();
	const latest = await prisma.project.findFirst({
		orderBy: { updatedAt: "desc" },
		select: { updatedAt: true, title: true },
	});

	return (
		<div className="max-w-2xl">
			<h1 className="text-2xl font-bold font-mono mb-8">Dashboard</h1>

			<div className="grid grid-cols-2 gap-4 mb-10">
				<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
					<p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">
						Projects in DB
					</p>
					<p className="text-3xl font-bold font-mono">{projectCount}</p>
				</div>
				<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
					<p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">
						Last updated
					</p>
					<p className="text-sm font-mono text-zinc-300">
						{latest?.title ?? "—"}
					</p>
					<p className="text-xs text-zinc-600 mt-1">
						{latest?.updatedAt.toLocaleDateString("fr-FR") ?? ""}
					</p>
				</div>
			</div>

			<div className="flex gap-4">
				<Link
					href="/admin/github"
					className="bg-zinc-100 text-zinc-900 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white transition-colors"
				>
					Import from GitHub
				</Link>
				<Link
					href="/admin/projects"
					className="border border-zinc-700 text-zinc-300 px-5 py-2.5 rounded-lg text-sm font-medium hover:border-zinc-500 transition-colors"
				>
					Manage Projects
				</Link>
			</div>
		</div>
	);
}
