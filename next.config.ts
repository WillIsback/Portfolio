import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withWorkflow } from "workflow/next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

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

// withWorkflow renvoie une fonction de config Next (phase) => Promise<NextConfig> :
// next-intl doit donc recevoir un objet de config, jamais la sortie de withWorkflow.
export default withWorkflow(withNextIntl(baseConfig));
