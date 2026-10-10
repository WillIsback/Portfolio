import { AI_DOMAINS, type AiDomain, normalizeDomains } from "@/lib/domains";
import { normalizePractices, type Practice } from "@/lib/practices";

export const LANGUAGES = [
	"Python",
	"TypeScript",
	"JavaScript",
	"Rust",
] as const;
export const DATABASES = [
	"Postgresql",
	"MongoDB",
	"Informix",
	"SQLite",
] as const;
export const BACKENDS = ["FastAPI", "Fastify", "ExpressJs"] as const;
export const FRONTENDS = [
	"React",
	"NextJs",
	"Tanstack",
	"Svelte",
	"SvelteKit",
	"TailwindCSS",
] as const;
export const DEVOPS = ["Docker", "GithubActions"] as const;
export const ML_STACK = [
	"PyTorch",
	"Transformers",
	"ScikitLearn",
	"Pandas",
	"XGBoost",
	"HuggingFace",
	"VLLM",
	"WandB",
	"LlmSdk",
] as const;

export interface DetectInput {
	primaryLanguage: string | null;
	filePaths: string[];
	npm: string[];
	python: string[];
	composeImages: string[];
	hasCargo: boolean;
	readmeHead: string;
	topics: string[];
}

export interface Detection {
	languages: (typeof LANGUAGES)[number][];
	databases: (typeof DATABASES)[number][];
	backends: (typeof BACKENDS)[number][];
	frontends: (typeof FRONTENDS)[number][];
	devops: (typeof DEVOPS)[number][];
	mlStack: (typeof ML_STACK)[number][];
	domains: AiDomain[];
	practices: Practice[];
}

/** Casse, tirets, soulignés et points sont équivalents (PEP 503), `@scope/` conservé. */
const norm = (name: string) => name.toLowerCase().replace(/[-_.]+/g, "-");

type Matcher = string | RegExp;
/** Chaîne = nom exact ; RegExp = motif sur le nom normalisé (jokers `x*`, `@scope/*`). */
const matches = (names: Set<string>, ...rules: Matcher[]) =>
	[...names].some((n) =>
		rules.some((r) => (typeof r === "string" ? n === r : r.test(n))),
	);

function ordered<T extends string>(order: readonly T[], found: Set<T>): T[] {
	return order.filter((v) => found.has(v));
}

export function detectProject(input: DetectInput): Detection {
	const deps = new Set([...input.npm, ...input.python].map(norm));
	const images = new Set(input.composeImages.map(norm));
	const all = new Set([...deps, ...images]);
	const text = `${input.readmeHead}\n${input.topics.join(" ")}`.toLowerCase();
	const topics = input.topics.join(" ").toLowerCase();

	const languages = new Set<Detection["languages"][number]>();
	if ((LANGUAGES as readonly string[]).includes(input.primaryLanguage ?? "")) {
		languages.add(input.primaryLanguage as Detection["languages"][number]);
	}
	if (input.hasCargo) languages.add("Rust");

	const databases = new Set<Detection["databases"][number]>();
	if (
		matches(deps, "pg", /^psycopg/, "asyncpg") ||
		matches(images, "postgres", "pgvector")
	)
		databases.add("Postgresql");
	if (matches(deps, "mongoose", "mongodb", "pymongo") || images.has("mongo"))
		databases.add("MongoDB");
	if (matches(deps, "better-sqlite3", "sqlite3")) databases.add("SQLite");

	const backends = new Set<Detection["backends"][number]>();
	if (deps.has("fastapi")) backends.add("FastAPI");
	if (deps.has("fastify")) backends.add("Fastify");
	if (deps.has("express")) backends.add("ExpressJs");

	const frontends = new Set<Detection["frontends"][number]>();
	if (deps.has("next")) frontends.add("NextJs");
	if (deps.has("react")) frontends.add("React");
	if (deps.has("svelte")) frontends.add("Svelte");
	if (deps.has("@sveltejs/kit")) frontends.add("SvelteKit");
	if (matches(deps, /^@tanstack\//)) frontends.add("Tanstack");
	if (deps.has("tailwindcss")) frontends.add("TailwindCSS");

	const devops = new Set<Detection["devops"][number]>();
	if (
		input.filePaths.some((p) => /(^|\/)Dockerfile(\.(?!md$)[\w-]+)?$/.test(p))
	)
		devops.add("Docker");
	if (input.filePaths.some((p) => p.startsWith(".github/workflows/")))
		devops.add("GithubActions");

	const ml = new Set<Detection["mlStack"][number]>();
	if (deps.has("torch")) ml.add("PyTorch");
	if (deps.has("transformers")) ml.add("Transformers");
	if (deps.has("scikit-learn")) ml.add("ScikitLearn");
	if (deps.has("pandas")) ml.add("Pandas");
	if (deps.has("xgboost")) ml.add("XGBoost");
	if (matches(deps, "huggingface-hub", "datasets")) ml.add("HuggingFace");
	if (deps.has("vllm") || [...images].some((i) => /^vllm(-|$)/.test(i)))
		ml.add("VLLM");
	if (deps.has("wandb")) ml.add("WandB");
	if (matches(deps, "openai", "ai", /^@ai-sdk\//, "anthropic", "mistralai"))
		ml.add("LlmSdk");

	const domains = new Set<string>();
	if (matches(deps, "torch", "scikit-learn", "xgboost")) domains.add("ML");
	if (deps.has("transformers")) domains.add("NLP");
	if (
		matches(
			deps,
			"torchvision",
			"ultralytics",
			"open-clip-torch",
			"opencv-python",
		)
	)
		domains.add("Vision");
	if (matches(deps, /^whisper/, "pyannote-audio", "faster-whisper"))
		domains.add("Speech");
	if (
		matches(all, "vllm", "openai", "ai", /^@ai-sdk\//, /^langchain/) ||
		[...images].some((i) => /^vllm(-|$)/.test(i))
	)
		domains.add("LLM");
	if (deps.has("pandas") && matches(deps, "matplotlib", "seaborn"))
		domains.add("DataAnalysis");
	if (text.includes("classif")) domains.add("Classifier");
	if (text.includes("regress")) domains.add("Regressor");
	if (topics.includes("agent")) domains.add("Agents");

	const paths = input.filePaths;
	const workflowNames = paths
		.filter((p) => /^\.(github|forgejo)\/workflows\/[^/]+\.ya?ml$/.test(p))
		.map((p) => p.slice(p.lastIndexOf("/") + 1).toLowerCase());
	const wf = (re: RegExp) => workflowNames.some((n) => re.test(n));
	const anyPath = (re: RegExp) => paths.some((p) => re.test(p));

	const practices = new Set<Practice>();
	if (workflowNames.length > 0 || anyPath(/^\.gitlab-ci\.yml$/))
		practices.add("ContinuousIntegration");
	if (devops.has("Docker") || anyPath(/(^|\/)(docker-)?compose\.ya?ml$/))
		practices.add("Containerization");
	// « cd » doit être un mot entier : `ci-cd.yml` oui, `abcd.yml` / `scd-report.yml` non.
	if (wf(/(^|[-_.])(deploy|release|cd)([-_.]|$)/) || anyPath(/^vercel\.json$/))
		practices.add("ContinuousDeployment");
	if (
		matches(
			deps,
			"vitest",
			"jest",
			"pytest",
			"@playwright/test",
			"playwright",
		) ||
		anyPath(/(^|\/)(tests|__tests__)\//)
	)
		practices.add("AutomatedTesting");
	if (
		matches(
			deps,
			/^opentelemetry-/,
			/^@opentelemetry\//,
			"prometheus-client",
			"prom-client",
		)
	)
		practices.add("Observability");
	if (
		anyPath(/^(\.github\/)?renovate\.json5?$/) ||
		anyPath(/^\.github\/dependabot\.ya?ml$/)
	)
		practices.add("DependencyUpdates");
	if (
		wf(/codeql|semgrep|bandit/) ||
		anyPath(/^\.semgrep\.ya?ml$/) ||
		matches(deps, "bandit", "semgrep")
	)
		practices.add("StaticAnalysis");
	if (
		wf(/gitleaks|trufflehog/) ||
		anyPath(/^\.gitleaks\.toml$|^\.secrets\.baseline$/)
	)
		practices.add("SecretsManagement");
	if (matches(deps, "mlflow", "wandb", "comet-ml", "neptune"))
		practices.add("ExperimentTracking");
	if (anyPath(/^dvc\.yaml$|^\.dvc\/|\.dvc$/) || deps.has("dvc"))
		practices.add("DataVersioning");
	if (
		matches(deps, "vllm", "bentoml", "torchserve", "ray") ||
		[...images].some((i) => /(^|\/)vllm/.test(i)) ||
		(deps.has("fastapi") &&
			matches(deps, "torch", "transformers", "scikit-learn"))
	)
		practices.add("ModelServing");
	if (
		matches(deps, "langfuse", "ragas", "deepeval", "promptfoo", "arize-phoenix")
	)
		practices.add("LlmEvaluation");

	return {
		languages: ordered(LANGUAGES, languages),
		databases: ordered(DATABASES, databases),
		backends: ordered(BACKENDS, backends),
		frontends: ordered(FRONTENDS, frontends),
		devops: ordered(DEVOPS, devops),
		mlStack: ordered(ML_STACK, ml),
		domains: normalizeDomains([...domains]).filter((d) =>
			(AI_DOMAINS as readonly string[]).includes(d),
		),
		practices: normalizePractices([...practices]),
	};
}
