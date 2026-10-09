import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	parseComposeImages,
	parsePackageJson,
	parsePyproject,
	parseRequirements,
} from "./manifests";

const fixture = (name: string) =>
	readFileSync(join(__dirname, "__fixtures__", name), "utf8");

describe("parsePackageJson", () => {
	it("liste dependencies et devDependencies (Next.js + Prisma)", () => {
		const names = parsePackageJson(fixture("nextjs-prisma.package.json"));
		expect(names).toEqual(
			expect.arrayContaining([
				"next",
				"react",
				"pg",
				"ai",
				"@ai-sdk/openai-compatible",
				"@prisma/client",
				"prisma",
				"tailwindcss",
			]),
		);
		expect(names).not.toContain("scripts");
	});
	it("renvoie [] pour un JSON cassé ou non objet", () => {
		expect(parsePackageJson(fixture("broken-package-json.txt"))).toEqual([]);
		expect(parsePackageJson("[1]")).toEqual([]);
		expect(parsePackageJson("null")).toEqual([]);
	});
});

describe("parseRequirements", () => {
	const names = parseRequirements(fixture("fastapi-torch.requirements.txt"));
	it("extrait les noms sans version ni extras", () => {
		expect(names).toEqual(
			expect.arrayContaining([
				"fastapi",
				"fastapi-cli",
				"torch",
				"torchvision",
				"transformers",
				"psycopg",
				"huggingface-hub",
				"uvicorn",
			]),
		);
	});
	it("ignore commentaires, options, URL, marqueurs et normalise la casse", () => {
		expect(names).toContain("pandas");
		expect(names.some((n) => n.startsWith("-") || n.startsWith("#"))).toBe(
			false,
		);
		expect(names).not.toContain("git");
		expect(names).not.toContain("serveur");
	});
});

describe("parsePyproject", () => {
	const names = parsePyproject(fixture("optional-deps.pyproject.toml"));
	it("lit dependencies, optional-dependencies et dependency-groups", () => {
		expect(names).toEqual(
			expect.arrayContaining([
				"pyyaml",
				"scikit-learn",
				"pyannote.audio",
				"pytest",
				"pandas",
				"sentence-transformers",
				"matplotlib",
				"wandb",
				"ipykernel",
			]),
		);
	});
	it("ignore les autres sections et les tables include-group", () => {
		expect(names).not.toContain("maturin");
		expect(names).not.toContain("dev");
		expect(names).not.toContain("include-group");
	});
	it("retourne [] sans dépendances", () => {
		expect(parsePyproject('[project]\nname = "x"\n')).toEqual([]);
	});
});

describe("parseComposeImages", () => {
	it("garde le dernier segment, sans tag ni digest", () => {
		expect(
			parseComposeImages(fixture("postgres-vllm.docker-compose.yml")),
		).toEqual([
			"pgvector",
			"vllm-node-tf5",
			"vllm",
			"redis",
			"backend",
			"postgres",
		]);
	});
});
