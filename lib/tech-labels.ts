/** Libellés lisibles des valeurs d'énumération de la base (filtres + listes de technologies). */
export const DATABASE_LABELS: Record<string, string> = {
	Postgresql: "PostgreSQL",
	MongoDB: "MongoDB",
	Informix: "Informix",
	SQLite: "SQLite",
};

export const BACKEND_LABELS: Record<string, string> = {
	FastAPI: "FastAPI",
	Fastify: "Fastify",
	ExpressJs: "Express.js",
	JupyterNotebook: "Jupyter Notebook",
};

export const FRONTEND_LABELS: Record<string, string> = {
	React: "React",
	NextJs: "Next.js",
	Tanstack: "Tanstack",
	Svelte: "Svelte",
	SvelteKit: "SvelteKit",
	TailwindCSS: "Tailwind CSS",
};

export const DEVOPS_LABELS: Record<string, string> = {
	Docker: "Docker",
	GithubActions: "GitHub Actions",
};

export const LANGUAGE_LABELS: Record<string, string> = {
	Python: "Python",
	TypeScript: "TypeScript",
	JavaScript: "JavaScript",
	Rust: "Rust",
};

export const ML_STACK_LABELS: Record<string, string> = {
	PyTorch: "PyTorch",
	Transformers: "Transformers",
	ScikitLearn: "scikit-learn",
	Pandas: "pandas",
	XGBoost: "XGBoost",
	HuggingFace: "Hugging Face",
	VLLM: "vLLM",
	WandB: "Weights & Biases",
	LlmSdk: "SDK LLM",
};

const ALL_LABELS: Record<string, string> = {
	...LANGUAGE_LABELS,
	...DATABASE_LABELS,
	...BACKEND_LABELS,
	...FRONTEND_LABELS,
	...DEVOPS_LABELS,
	...ML_STACK_LABELS,
};

/** Libellé humain d'une valeur de la base ; la valeur brute à défaut. */
export const techLabel = (value: string): string => ALL_LABELS[value] ?? value;

export const toOptions = (labels: Record<string, string>) =>
	Object.entries(labels).map(([value, label]) => ({ value, label }));
