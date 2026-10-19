import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AnalyzeOk, BoardProject } from "@/lib/github/board";
import type { RemoteRepo } from "@/lib/github/sync";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {} }) }));
vi.mock("@/app/actions/admin.action", () => ({
	analyzeRepo: vi.fn(),
	applySync: vi.fn(),
	importRepo: vi.fn(),
}));

import { DiffPanel } from "./DiffPanel";
import { ImportForm } from "./ImportForm";
import { SyncBoard } from "./SyncBoard";

const repo = (over: Partial<RemoteRepo>): RemoteRepo => ({
	id: 1,
	fullName: "me/alpha",
	description: "d",
	pushedAt: new Date("2026-01-05T00:00:00Z"),
	isPrivate: false,
	archived: false,
	...over,
});
const project: BoardProject = {
	id: 7,
	title: "Gone",
	description: "d",
	lastUpdate: null,
	isPrivate: false,
	github: "https://github.com/me/gone",
	githubRepoId: 99,
	status: null,
	languages: [],
	databases: [],
	backends: [],
	frontends: [],
	devops: [],
	mlStack: [],
	domains: [],
	practices: [],
};

describe("SyncBoard (rendu serveur)", () => {
	const html = renderToStaticMarkup(
		<SyncBoard
			repos={[repo({}), repo({ id: 2, fullName: "me/beta", archived: true })]}
			projects={[project]}
		/>,
	);
	it("tableau avec en-têtes, statuts et zone aria-live", () => {
		expect(html).toContain('<th scope="col"');
		expect(html).toContain("nouveau");
		expect(html).toContain("disparu");
		expect(html).toContain('aria-live="polite"');
		expect(html).toContain("Analyser tout");
	});
});

describe("DiffPanel (rendu serveur)", () => {
	it("cases non cochées, étiquetées, listes en ajout seulement", () => {
		const html = renderToStaticMarkup(
			<DiffPanel
				projectId={7}
				fullName="me/alpha"
				onDone={() => {}}
				diff={[
					{
						field: "languages",
						kind: "list",
						added: ["Rust"],
						removed: [],
						proposedList: ["Python", "Rust"],
					},
					{
						field: "status",
						kind: "scalar",
						current: null,
						proposed: "Archived",
					},
				]}
			/>,
		);
		expect(html).not.toContain("checked");
		expect(html).toContain('for="diff-7-languages"');
		expect(html).toContain("Langages : ajouter les valeurs détectées");
		expect(html).not.toContain("remplacer");
		expect(html).toContain("Passer le statut à archivé");
		expect(html).toContain("+ Rust");
	});
});

describe("ImportForm (rendu serveur)", () => {
	it("pré-remplit titre et listes détectées", () => {
		const result: AnalyzeOk = {
			ok: true,
			projectId: null,
			images: [],
			diff: [],
			remote: repo({ languages: ["Rust"], domains: ["ML"] }),
		};
		const html = renderToStaticMarkup(
			<ImportForm result={result} onDone={() => {}} />,
		);
		expect(html).toContain('value="alpha"');
		expect(html).toContain("Rust");
		expect(html).toContain("Créer le projet");
	});
});
