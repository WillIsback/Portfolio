import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import JsonLd from "./JsonLd";

describe("JsonLd", () => {
	it("ne laisse pas une valeur fermer la balise script", () => {
		const html = renderToStaticMarkup(
			<JsonLd data={{ name: "</script><b>" }} />,
		);
		expect(html).toContain('type="application/ld+json"');
		expect(html).not.toContain("</script><b>");
		expect(html).toContain("</script>");
		expect(html.match(/<\/script>/g)).toHaveLength(1);
	});

	it("accepte une liste d'objets", () => {
		const html = renderToStaticMarkup(<JsonLd data={[{ a: 1 }, { b: 2 }]} />);
		expect(html).toContain('[{"a":1},{"b":2}]');
	});
});
