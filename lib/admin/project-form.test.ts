import { describe, expect, it } from "vitest";
import type { AdminProject } from "@/schemas";
import {
	buildPreviewProject,
	buildSavePayload,
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

describe("buildSavePayload", () => {
	it("rogne accroche et période (blanc -> absent)", () => {
		const r = buildSavePayload(
			{ ...form, pitch: "  ", period: " 2026 " },
			false,
			"1",
		);
		expect(r.ok && r.data.pitch).toBeUndefined();
		expect(r.ok && r.data.period).toBe("2026");
		expect(r.ok && r.data.featuredRank).toBeUndefined();
	});
	it("valide le rang quand mis en avant", () => {
		expect(buildSavePayload(form, true, "").ok).toBe(false);
		expect(buildSavePayload(form, true, "0").ok).toBe(false);
		expect(buildSavePayload(form, true, "1.5").ok).toBe(false);
		const r = buildSavePayload(form, true, "3");
		expect(r.ok && r.data.featuredRank).toBe(3);
	});
});
