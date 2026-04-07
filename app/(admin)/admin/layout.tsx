// app/(admin)/admin/layout.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();
	if (!session) redirect("/admin/login");

	return (
		<div className="flex min-h-screen bg-zinc-950 text-zinc-100">
			<aside className="w-56 border-r border-zinc-800 flex flex-col p-4 gap-1 shrink-0">
				<p className="text-xs text-zinc-500 uppercase tracking-widest mb-4 font-mono">
					Admin
				</p>
				<Link
					href="/admin/dashboard"
					className="text-sm text-zinc-400 hover:text-white py-1.5 px-2 rounded hover:bg-zinc-800 transition-colors"
				>
					Dashboard
				</Link>
				<Link
					href="/admin/github"
					className="text-sm text-zinc-400 hover:text-white py-1.5 px-2 rounded hover:bg-zinc-800 transition-colors"
				>
					Import from GitHub
				</Link>
				<Link
					href="/admin/projects"
					className="text-sm text-zinc-400 hover:text-white py-1.5 px-2 rounded hover:bg-zinc-800 transition-colors"
				>
					Projects
				</Link>
				<div className="mt-auto pt-4 border-t border-zinc-800">
					<p className="text-xs text-zinc-600 mb-2 truncate">
						{session.user?.name}
					</p>
					<form
						action={async () => {
							"use server";
							await signOut({ redirectTo: "/admin/login" });
						}}
					>
						<button
							type="submit"
							className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
						>
							Sign out
						</button>
					</form>
				</div>
			</aside>
			<main className="flex-1 p-8 overflow-auto">{children}</main>
		</div>
	);
}
