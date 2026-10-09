import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AdminProject } from "@/schemas";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push() {} }) }));
vi.mock("sonner", () => ({ toast: { success() {}, error() {} } }));
vi.mock("@/app/actions/admin.action", () => ({
	updateProject: vi.fn(),
	listRepoImages: vi.fn(),
}));

import { ImagePicker } from "./ImagePicker";
import { ProjectEditForm } from "./ProjectEditForm";

const base: AdminProject = {
	title: "Alpha",
	description: "Une description. Deux phrases.",
	isPrivate: false,
	isAiGenerated: false,
	languages: [],
	databases: [],
	backends: [],
	frontends: [],
	devops: [],
	domains: ["LLM"],
	mlStack: ["PyTorch"],
	pitch: "Mon accroche",
	status: "Done",
};

const render = (over: Partial<AdminProject> = {}) =>
	renderToStaticMarkup(
		<ProjectEditForm
			id={3}
			initial={{ ...base, ...over }}
			articles={[{ slug: "a", title: "Article cité" }]}
		/>,
	);

describe("ProjectEditForm (rendu serveur)", () => {
	it("affiche accroche + compteur, statut, ML & Data, articles et aperçu", () => {
		const html = render();
		expect(html).toContain('aria-describedby="pitch-count"');
		expect(html).toContain("12 / 140");
		expect(html).toContain("terminé");
		expect(html).toContain("ML &amp; Data");
		expect(html).toContain("Weights &amp; Biases");
		expect(html).toContain("Article cité");
		expect(html).toContain("Aperçu sur le site");
		expect(html).toContain("Choisir dans le dépôt");
	});

	it("n'affiche le rang que si « mettre en avant » est coché", () => {
		expect(render()).not.toContain('id="rank"');
		const html = render({ featuredRank: 2 });
		expect(html).toContain('id="rank"');
		expect(html).toContain('value="2"');
	});

	it("dépôt privé : mention, pas de bouton", () => {
		const html = render({ isPrivate: true });
		expect(html).toContain("Capture impossible pour un dépôt privé");
		expect(html).not.toContain("Choisir dans le dépôt");
	});
});

describe("ImagePicker", () => {
	it("propose « Retirer » pour une capture du dépôt", () => {
		const html = renderToStaticMarkup(
			<ImagePicker
				projectId={1}
				isPrivate={false}
				value="https://raw.githubusercontent.com/me/a/main/x.png"
				onChange={() => {}}
			/>,
		);
		expect(html).toContain("Retirer");
	});
});
