import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

export const baseConfig: NextConfig = {
	images: {
		// Captures d'écran choisies dans les dépôts GitHub (admin, fiche projet).
		remotePatterns: [
			{
				protocol: "https",
				hostname: "raw.githubusercontent.com",
				pathname: "/WillIsback/**",
			},
		],
	},
	async headers() {
		return [
			{
				// Les URL portent ?v=<version du modèle> (lib/carnet/engine.ts) : cache immuable sans risque.
				source: "/models/carnet-static/:file*",
				headers: [
					{
						key: "Cache-Control",
						value: "public, max-age=31536000, immutable",
					},
				],
			},
		];
	},
};

export default withWorkflow(baseConfig);
