import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("resend", () => ({
	Resend: class {
		emails = { send: h.send };
	},
}));

import { sendEmail } from "./contact.action";

const form = (fields: Record<string, string>) => {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.set(key, value);
	return data;
};

const valid = {
	email: "visiteur@example.com",
	sujet: "Un sujet valide",
	message: "Un message suffisamment long pour passer la validation.",
};

beforeEach(() => {
	vi.clearAllMocks();
	h.send.mockResolvedValue({ id: "1" });
});

describe("sendEmail — validation serveur (sans JavaScript)", () => {
	it("renvoie une erreur par champ vide, sans envoyer", async () => {
		const result = await sendEmail(
			null,
			form({ email: "", sujet: "", message: "" }),
		);
		expect(result).toMatchObject({
			error: {
				email: expect.any(Array),
				sujet: expect.any(Array),
				message: expect.any(Array),
			},
		});
		expect(h.send).not.toHaveBeenCalled();
	});

	it("ne signale que les champs invalides", async () => {
		const result = await sendEmail(
			null,
			form({ ...valid, email: "pas-un-email" }),
		);
		const error = (result as { error: Record<string, unknown> }).error;
		expect(error).toHaveProperty("email");
		expect(error).not.toHaveProperty("sujet");
		expect(error).not.toHaveProperty("message");
		expect(h.send).not.toHaveBeenCalled();
	});

	it("envoie un message valide", async () => {
		const result = await sendEmail(null, form(valid));
		expect(result).toEqual({ success: true });
		expect(h.send).toHaveBeenCalledTimes(1);
	});
});
