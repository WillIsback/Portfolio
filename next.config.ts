import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
