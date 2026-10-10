import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/agents/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/agents/tools/projects.tools", () => ({ projectTools: {} }));

import { requireAdmin } from "@/lib/agents/auth";
import { POST } from "./route";

const mockedRequireAdmin = vi.mocked(requireAdmin);

beforeEach(() => {
	mockedRequireAdmin.mockReset();
});

describe("POST /api/agents/projects", () => {
	it("renvoie 401 pour un non-admin", async () => {
		mockedRequireAdmin.mockResolvedValue(false);
		const res = await POST(
			new Request("http://x", {
				method: "POST",
				body: JSON.stringify({ messages: [] }),
			}),
		);
		expect(res.status).toBe(401);
	});

	it("renvoie 400 pour un corps vide", async () => {
		mockedRequireAdmin.mockResolvedValue(true);
		const res = await POST(
			new Request("http://x", { method: "POST", body: "{}" }),
		);
		expect(res.status).toBe(400);
	});

	it("renvoie 400 pour un corps non JSON", async () => {
		mockedRequireAdmin.mockResolvedValue(true);
		const res = await POST(
			new Request("http://x", { method: "POST", body: "pas du json" }),
		);
		expect(res.status).toBe(400);
	});
});
