import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("next.config", () => {
	it("sert les fichiers du modèle avec un cache immuable", async () => {
		const rules = (await nextConfig.headers?.()) ?? [];
		const rule = rules.find((r) => r.source === "/models/carnet-static/:file*");
		expect(rule?.headers).toContainEqual({
			key: "Cache-Control",
			value: "public, max-age=31536000, immutable",
		});
	});
});
