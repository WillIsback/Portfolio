import { describe, expect, it } from "vitest";
import { baseConfig as nextConfig } from "./next.config";

describe("next.config", () => {
	it("sert les fichiers du modèle avec un cache immuable", async () => {
		const rules = (await nextConfig.headers?.()) ?? [];
		const rule = rules.find((r) => r.source === "/models/carnet-static/:file*");
		expect(rule?.headers).toContainEqual({
			key: "Cache-Control",
			value: "public, max-age=31536000, immutable",
		});
	});

	it("autorise les captures raw.githubusercontent.com dans next/image", () => {
		expect(nextConfig.images?.remotePatterns).toContainEqual({
			protocol: "https",
			hostname: "raw.githubusercontent.com",
			pathname: "/WillIsback/**",
		});
	});
});
