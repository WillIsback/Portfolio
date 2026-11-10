import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots.txt", () => {
	it("autorise tout sauf l'admin et l'API, et annonce le sitemap", () => {
		expect(robots()).toEqual({
			rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
			sitemap: "https://www.willisback.fr/sitemap.xml",
			host: "https://www.willisback.fr",
		});
	});
});
