// app/(admin)/admin/github/page.tsx
import prisma from "@/lib/db";
import { SYNC_SELECT, toBoardProject, toRemoteRepo } from "@/lib/github/board";
import { GithubError, listRepos } from "@/lib/github/client";
import { getAdminGithubToken } from "@/lib/github/token";
import { SyncBoard } from "./SyncBoard";

export const dynamic = "force-dynamic";

export default async function AdminGitHubPage() {
	const auth = await getAdminGithubToken();
	let error: string | null = null;
	let repos: ReturnType<typeof toRemoteRepo>[] = [];
	try {
		repos = (await listRepos(auth)).map(toRemoteRepo);
	} catch (e) {
		error = e instanceof GithubError ? e.message : "Liste GitHub indisponible.";
	}
	const rows = await prisma.project.findMany({ select: SYNC_SELECT });
	const projects = rows.map(toBoardProject);

	return (
		<div className="max-w-5xl">
			<h1 className="text-2xl font-bold font-mono mb-2">
				Synchronisation GitHub
			</h1>
			<p className="text-sm text-zinc-500 mb-6">
				Lecture seule côté GitHub. Les champs éditoriaux (titre, accroche,
				statut, période, capture, rang) ne sont jamais proposés, sauf le passage
				à « archivé » d&apos;un dépôt archivé.
			</p>
			{auth.mode === "public" && (
				<p className="mb-6 rounded-lg border border-amber-700 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
					Reconnecte-toi pour voir tes dépôts privés. En attendant, seuls les
					dépôts publics sont listés : un projet privé apparaît comme « disparu
					».
				</p>
			)}
			{error && (
				<p
					role="alert"
					className="mb-6 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-200"
				>
					{error}
				</p>
			)}
			<SyncBoard repos={repos} projects={projects} />
		</div>
	);
}
