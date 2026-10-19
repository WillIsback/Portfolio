import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		// Les worktrees vivent dans `.worktrees/`, donc à l'intérieur de la racine du
		// checkout principal. Sans cette exclusion, un `pnpm test` lancé depuis le
		// checkout principal ramasse aussi les tests des worktrees ; ceux-ci lisant
		// leurs sources via `process.cwd()`, ils résolvent contre le mauvais arbre et
		// échouent en masse alors que rien n'est cassé. On part des exclusions par
		// défaut plutôt que de les remplacer.
		exclude: [...configDefaults.exclude, "**/.worktrees/**"],
		server: {
			// `next-auth` et `next-intl` sont externalisés par défaut, donc importés par le
			// loader ESM de Node, qui ne sait pas résoudre `next/server` (le paquet `next`
			// n'a pas de champ "exports"). Vite les inline pour appliquer son propre
			// résolveur, comme le fait Next.js au build.
			deps: {
				inline: ["next-auth", "next-intl"],
			},
		},
	},
	resolve: {
		alias: { "@": path.resolve(__dirname, ".") },
	},
});
