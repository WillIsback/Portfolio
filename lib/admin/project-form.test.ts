import { describe, expect, it } from "vitest";
import type { AdminProject } from "@/schemas";
import {
	buildPreviewProject,
	needsCompletion,
	rawImageUrl,
} from "./project-form";

const form: AdminProject = {
	title: "T",
	description: "D",
	isPrivate: false,
	isAiGenerated: false,
	languages: ["Python"],
	databases: [],
	backends: ["FastAPI"],
	frontends: [],
	devops: ["Docker"],
	domains: ["LLM"],
	mlStack: ["PyTorch"],
	pitch: "accroche",
	status: "Done",
	period: "2026",
	featuredRank: 2,
};

describe("rawImageUrl", () => {
	it("encode chaque segment de la branche et du chemin", () => {
		expect(rawImageUrl("me/app", "feat/x y", "docs/a b#1.png")).toBe(
			"https://raw.githubusercontent.com/me/app/feat/x%20y/docs/a%20b%231.png",
		);
	});
});

describe("buildPreviewProject", () => {
	it("construit un NormalizedProject complet", () => {
		const p = buildPreviewProject(5, form);
		expect(p.id).toBe(5);
		expect(p.domains).toEqual([{ domain: "LLM" }]);
		expect(p.mlStack).toEqual([{ ml: "PyTorch" }]);
		expect(p.backends).toEqual([{ backend: "FastAPI" }]);
		expect(p.devops).toEqual([{ devops: "Docker" }]);
		expect(p.featuredRank).toBe(2);
		expect(p.imagePath).toBeNull();
		expect(p.github).toBeNull();
		expect(p.pitch).toBe("accroche");
		expect(p.status).toBe("Done");
	});
});

describe("needsCompletion", () => {
	it("signale l'absence d'accroche ou de domaine", () => {
		expect(needsCompletion({ pitch: null, domainCount: 1 })).toBe(true);
		expect(needsCompletion({ pitch: "  ", domainCount: 1 })).toBe(true);
		expect(needsCompletion({ pitch: "x", domainCount: 0 })).toBe(true);
		expect(needsCompletion({ pitch: "x", domainCount: 2 })).toBe(false);
	});
});
