import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import proxyHandler, { config } from "./proxy";

// Le contrat de `proxy` est celui d'un middleware Next : `(request, event)` avec un
// retour pouvant valoir `undefined`. Ici `intlProxy` répond toujours, on le restringit
// pour pouvoir asserter sur la réponse.
const proxy = proxyHandler as unknown as (
	request: NextRequest,
) => Promise<Response>;

describe("proxy", () => {
	it("couvre les routes admin et les routes publiques, hors api et assets", () => {
		expect(config.matcher).toContain("/admin/:path*");
		expect(config.matcher).toContain("/((?!api|_next|_vercel|.*\\..*).*)");
	});

	it("laisse passer une URL française sans préfixe", async () => {
		const res = await proxy(
			new NextRequest(new URL("https://willisback.fr/articles"), {
				headers: { "accept-language": "fr-FR,fr;q=0.9" },
			}),
		);
		expect(res.status).toBe(200);
	});

	it("préserve le préfixe de locale sur une URL déjà préfixée", async () => {
		const res = await proxy(
			new NextRequest(new URL("https://willisback.fr/en/articles"), {
				headers: { "accept-language": "fr-FR,fr;q=0.9" },
			}),
		);
		expect(res.status).toBe(200);
	});
});
