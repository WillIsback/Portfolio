import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
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
