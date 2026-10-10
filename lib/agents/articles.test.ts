import { describe, expect, it } from "vitest";
import { ArticleDraftSchema, frontmatterToMdx } from "./articles";

const draft = {
	slug: "carnet-agents",
	title: "Un carnet d'agents",
	description: "Deux agents dans l'admin.",
	date: "2026-10-10",
	tags: ["agents", "vllm"],
	status: "brouillon",
	projects: [3, 4],
	body: "## Intro\n\nTexte.",
};

describe("ArticleDraftSchema", () => {
	it("accepte un brouillon valide", () => {
		expect(ArticleDraftSchema.parse(draft).slug).toBe("carnet-agents");
	});
	it("refuse un slug invalide", () => {
		expect(
			ArticleDraftSchema.safeParse({ ...draft, slug: "Bad Slug" }).success,
		).toBe(false);
	});
});

describe("frontmatterToMdx", () => {
	it("produit un bloc frontmatter + corps", () => {
		const mdx = frontmatterToMdx(ArticleDraftSchema.parse(draft));
		expect(mdx).toContain('title: "Un carnet d\'agents"');
		expect(mdx).toContain("projects: [3, 4]");
		expect(mdx).toContain("## Intro");
	});
	it("cite un titre contenant un deux-points", () => {
		const mdx = frontmatterToMdx(
			ArticleDraftSchema.parse({ ...draft, title: "Carnet : agents" }),
		);
		expect(mdx).toContain('title: "Carnet : agents"');
	});
	it("échappe les guillemets et antislash", () => {
		const mdx = frontmatterToMdx(
			ArticleDraftSchema.parse({
				...draft,
				title: 'A "B" \\ C',
				tags: ["a, b"],
			}),
		);
		expect(mdx).toContain('title: "A \\"B\\" \\\\ C"');
		expect(mdx).toContain('tags: ["a, b"]');
	});
});
