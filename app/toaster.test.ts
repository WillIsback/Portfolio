import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) =>
	readFileSync(path.join(process.cwd(), file), "utf8");

describe("ThemedToaster", () => {
	it("n'est plus chargé par toutes les pages (layout racine)", () => {
		expect(read("app/layout.tsx")).not.toContain("ThemedToaster");
	});

	it("est monté là où des toasts sont émis", () => {
		expect(read("app/Contact/page.tsx")).toContain("<ThemedToaster />");
		expect(read("app/(admin)/admin/layout.tsx")).toContain("<ThemedToaster />");
	});
});
