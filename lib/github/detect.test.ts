import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type DetectInput, detectProject } from "./detect";
import {
	parseComposeImages,
	parsePackageJson,
	parsePyproject,
	parseRequirements,
} from "./manifests";

const fixture = (name: string) =>
	readFileSync(join(__dirname, "__fixtures__", name), "utf8");

const base: DetectInput = {
	primaryLanguage: null,
	filePaths: [],
	npm: [],
	python: [],
	composeImages: [],
	hasCargo: false,
	readmeHead: "",
	topics: [],
};
const detect = (over: Partial<DetectInput>) =>
	detectProject({ ...base, ...over });

describe("detectProject sur manifestes réels", () => {
	it("Next.js + Prisma", () => {
		const r = detect({
			primaryLanguage: "TypeScript",
			npm: parsePackageJson(fixture("nextjs-prisma.package.json")),
			filePaths: ["Dockerfile", ".github/workflows/ci.yml"],
		});
		expect(r.languages).toEqual(["TypeScript"]);
		expect(r.frontends).toEqual(
			["React", "NextJs", "TailwindCSS"].sort(
				(a, b) =>
					[
						"React",
						"NextJs",
						"Tanstack",
						"Svelte",
						"SvelteKit",
						"TailwindCSS",
					].indexOf(a) -
					[
						"React",
						"NextJs",
						"Tanstack",
						"Svelte",
						"SvelteKit",
						"TailwindCSS",
					].indexOf(b),
			),
		);
		expect(r.databases).toEqual(["Postgresql"]);
		expect(r.devops).toEqual(["Docker", "GithubActions"]);
		expect(r.mlStack).toEqual(["LlmSdk"]);
		expect(r.domains).toEqual(["LLM"]);
	});

	it("FastAPI + torch + compose postgres/vllm", () => {
		const r = detect({
			primaryLanguage: "Python",
			python: parseRequirements(fixture("fastapi-torch.requirements.fixture")),
			composeImages: parseComposeImages(
				fixture("postgres-vllm.docker-compose.yml"),
			),
		});
		expect(r.backends).toEqual(["FastAPI"]);
		expect(r.databases).toEqual(["Postgresql"]);
		expect(r.mlStack).toEqual([
			"PyTorch",
			"Transformers",
			"Pandas",
			"HuggingFace",
			"VLLM",
		]);
		expect(r.domains).toEqual(
			["ML", "LLM", "Vision", "NLP"].sort(
				(a, b) =>
					["ML", "LLM", "Vision", "NLP"].indexOf(a) -
					["ML", "LLM", "Vision", "NLP"].indexOf(b),
			),
		);
	});

	it("pyproject avec optional-deps : pandas + matplotlib → DataAnalysis", () => {
		const r = detect({
			python: parsePyproject(fixture("optional-deps.pyproject.toml")),
			hasCargo: true,
			primaryLanguage: "Rust",
		});
		expect(r.languages).toEqual(["Rust"]);
		expect(r.mlStack).toEqual(["ScikitLearn", "Pandas", "WandB"]);
		expect(r.domains).toEqual(["DataAnalysis", "ML", "Speech"]);
	});
});

describe("règles par catégorie", () => {
	it("langages : langage principal et Cargo.toml, inconnu ignoré", () => {
		expect(detect({ primaryLanguage: "Python" }).languages).toEqual(["Python"]);
		expect(detect({ primaryLanguage: "Go" }).languages).toEqual([]);
		expect(
			detect({ primaryLanguage: "Python", hasCargo: true }).languages,
		).toEqual(["Python", "Rust"]);
	});
	it("bases", () => {
		expect(detect({ python: ["psycopg2-binary"] }).databases).toEqual([
			"Postgresql",
		]);
		expect(detect({ python: ["asyncpg"] }).databases).toEqual(["Postgresql"]);
		expect(detect({ composeImages: ["mongo"] }).databases).toEqual(["MongoDB"]);
		expect(detect({ npm: ["mongoose"] }).databases).toEqual(["MongoDB"]);
		expect(detect({ npm: ["better-sqlite3"] }).databases).toEqual(["SQLite"]);
		expect(detect({ python: ["pymongo", "pg"] }).databases).toEqual([
			"Postgresql",
			"MongoDB",
		]);
	});
	it("back-ends et front-ends", () => {
		expect(detect({ npm: ["fastify", "express"] }).backends).toEqual([
			"Fastify",
			"ExpressJs",
		]);
		expect(
			detect({ npm: ["svelte", "@sveltejs/kit", "@tanstack/react-query"] })
				.frontends,
		).toEqual(["Tanstack", "Svelte", "SvelteKit"]);
	});
	it("devops via les chemins", () => {
		expect(detect({ filePaths: ["api/Dockerfile"] }).devops).toEqual([
			"Docker",
		]);
		expect(detect({ filePaths: [".github/workflows/x.yml"] }).devops).toEqual([
			"GithubActions",
		]);
		expect(detect({ filePaths: ["docs/Dockerfile.md"] }).devops).toEqual([]);
	});
	it("ML & Data", () => {
		expect(
			detect({
				python: ["scikit-learn", "xgboost", "wandb", "datasets", "anthropic"],
			}).mlStack,
		).toEqual(["ScikitLearn", "XGBoost", "HuggingFace", "WandB", "LlmSdk"]);
		expect(detect({ composeImages: ["vllm"] }).mlStack).toEqual(["VLLM"]);
		expect(detect({ npm: ["@ai-sdk/openai"] }).mlStack).toEqual(["LlmSdk"]);
		expect(detect({ python: ["mistralai"] }).mlStack).toEqual(["LlmSdk"]);
	});
});

describe("domaines", () => {
	it("ML, NLP, Vision, Speech, LLM", () => {
		expect(detect({ python: ["xgboost"] }).domains).toEqual(["ML"]);
		expect(detect({ python: ["transformers"] }).domains).toEqual(["NLP"]);
		expect(detect({ python: ["opencv-python"] }).domains).toEqual(["Vision"]);
		expect(detect({ python: ["Whisper_X"] }).domains).toEqual(["Speech"]);
		expect(detect({ python: ["pyannote.audio"] }).domains).toEqual(["Speech"]);
		expect(detect({ python: ["langchain-core"] }).domains).toEqual(["LLM"]);
		expect(detect({ composeImages: ["vllm-openai"] }).domains).toEqual(["LLM"]);
	});
	it("pandas seul n'est pas DataAnalysis, avec seaborn oui", () => {
		expect(detect({ python: ["pandas"] }).domains).toEqual([]);
		expect(detect({ python: ["pandas", "seaborn"] }).domains).toEqual([
			"DataAnalysis",
		]);
	});
	it("« classif » dans le README → Classifier, plus ML", () => {
		expect(detect({ readmeHead: "Image Classification demo" }).domains).toEqual(
			["ML", "Classifier"],
		);
		expect(detect({ topics: ["text-classifier"] }).domains).toEqual([
			"ML",
			"Classifier",
		]);
	});
	it("« regress » → Regressor, « agent » seulement dans les topics", () => {
		expect(detect({ readmeHead: "Linear regression" }).domains).toEqual([
			"ML",
			"Regressor",
		]);
		expect(detect({ topics: ["ai-agent"] }).domains).toEqual(["Agents"]);
		expect(detect({ readmeHead: "an agent runner" }).domains).toEqual([]);
	});
});

describe("detectProject — pratiques", () => {
	const has = (over: Partial<DetectInput>, practice: string) =>
		expect(detect(over).practices).toContain(practice);
	const hasNot = (over: Partial<DetectInput>, practice: string) =>
		expect(detect(over).practices).not.toContain(practice);

	it("DevOps", () => {
		has({ filePaths: [".github/workflows/ci.yml"] }, "ContinuousIntegration");
		has(
			{ filePaths: [".forgejo/workflows/test.yaml"] },
			"ContinuousIntegration",
		);
		has({ filePaths: [".gitlab-ci.yml"] }, "ContinuousIntegration");
		hasNot(
			{ filePaths: [".github/workflows/README.md"] },
			"ContinuousIntegration",
		);
		has({ filePaths: ["api/Dockerfile"] }, "Containerization");
		has({ filePaths: ["deploy/compose.yaml"] }, "Containerization");
		has(
			{ filePaths: [".github/workflows/deploy.yml"] },
			"ContinuousDeployment",
		);
		has(
			{ filePaths: [".github/workflows/release-please.yml"] },
			"ContinuousDeployment",
		);
		has({ filePaths: [".github/workflows/ci-cd.yml"] }, "ContinuousDeployment");
		has({ filePaths: ["vercel.json"] }, "ContinuousDeployment");
		hasNot(
			{ filePaths: [".github/workflows/abcd.yml"] },
			"ContinuousDeployment",
		);
		hasNot(
			{ filePaths: [".github/workflows/scd-report.yml"] },
			"ContinuousDeployment",
		);
		has({ npm: ["vitest"] }, "AutomatedTesting");
		has({ python: ["pytest"] }, "AutomatedTesting");
		has({ filePaths: ["tests/test_api.py"] }, "AutomatedTesting");
		has({ npm: ["@opentelemetry/api"] }, "Observability");
		has({ python: ["opentelemetry-sdk"] }, "Observability");
		has({ python: ["prometheus_client"] }, "Observability");
	});

	it("SecOps", () => {
		has({ filePaths: ["renovate.json"] }, "DependencyUpdates");
		has({ filePaths: [".github/dependabot.yml"] }, "DependencyUpdates");
		has({ filePaths: [".github/workflows/codeql.yml"] }, "StaticAnalysis");
		has({ python: ["bandit"] }, "StaticAnalysis");
		has({ filePaths: [".gitleaks.toml"] }, "SecretsManagement");
		has(
			{ filePaths: [".github/workflows/trufflehog.yml"] },
			"SecretsManagement",
		);
	});

	it("MLOps", () => {
		has({ python: ["mlflow"] }, "ExperimentTracking");
		has({ python: ["wandb"] }, "ExperimentTracking");
		has({ filePaths: ["dvc.yaml"] }, "DataVersioning");
		has({ filePaths: ["data/raw.csv.dvc"] }, "DataVersioning");
		has({ python: ["vllm"] }, "ModelServing");
		has({ composeImages: ["vllm/vllm-openai"] }, "ModelServing");
		has({ python: ["fastapi", "scikit-learn"] }, "ModelServing");
		hasNot({ python: ["fastapi"] }, "ModelServing");
		has({ python: ["langfuse"] }, "LlmEvaluation");
		has({ npm: ["promptfoo"] }, "LlmEvaluation");
	});

	it("jamais Durcissement ni Registre de modèles, ordre canonique", () => {
		const r = detect({
			filePaths: ["Dockerfile", ".github/workflows/ci.yml", "renovate.json"],
			python: ["mlflow", "fastapi", "torch"],
		});
		expect(r.practices).toEqual([
			"ContinuousIntegration",
			"Containerization",
			"DependencyUpdates",
			"ExperimentTracking",
			"ModelServing",
		]);
	});
});

describe("detectProject — Jupyter et variantes de noms", () => {
	it("Jupyter Notebook : langage Python et back-end JupyterNotebook", () => {
		const r = detect({ primaryLanguage: "Jupyter Notebook" });
		expect(r.languages).toEqual(["Python"]);
		expect(r.backends).toEqual(["JupyterNotebook"]);
		expect(detect({ filePaths: ["notebooks/eda.ipynb"] }).backends).toEqual([
			"JupyterNotebook",
		]);
		expect(detect({ primaryLanguage: "Python" }).backends).toEqual([]);
	});

	it("variantes de noms reconnues", () => {
		const p = (paths: string[]) => detect({ filePaths: paths }).practices;
		expect(p([".github/workflows/deployment.yml"])).toContain(
			"ContinuousDeployment",
		);
		expect(p([".github/workflows/releases.yml"])).toContain(
			"ContinuousDeployment",
		);
		expect(p(["docker-compose.prod.yml"])).toContain("Containerization");
		expect(p(["test/api.test.js"])).toContain("AutomatedTesting");
		expect(p([".github/workflows/redeploy-docs.yml"])).not.toContain(
			"ContinuousDeployment",
		);
		expect(detect({ filePaths: ["Dockerfile.prod"] }).devops).toEqual([
			"Docker",
		]);
	});

	it("GithubActions ignore un README sous .github/workflows/", () => {
		expect(
			detect({ filePaths: [".github/workflows/README.md"] }).devops,
		).toEqual([]);
	});
});
