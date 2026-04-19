import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "./contact.action";

const sendMailMock = vi.fn();

vi.mock("nodemailer", () => ({
	default: {
		createTransport: vi.fn(() => ({
			sendMail: sendMailMock,
		})),
	},
}));

describe("sendEmail", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env = { ...originalEnv };
	});

	it("returns validation errors when form data is invalid", async () => {
		const formData = new FormData();
		formData.set("email", "bad-email");
		formData.set("sujet", "ok");
		formData.set("message", "short");

		const result = await sendEmail(null, formData);

		expect(result).toHaveProperty("error");
		expect(sendMailMock).not.toHaveBeenCalled();
	});

	it("returns smtp configuration error when credentials are missing", async () => {
		delete process.env.SMTP_USER;
		delete process.env.SMTP_PASSWORD;

		const formData = new FormData();
		formData.set("email", "john@example.com");
		formData.set("sujet", "Sujet valide");
		formData.set("message", "Message assez long pour passer la validation.");

		const result = await sendEmail(null, formData);

		expect(result).toEqual({
			error: "Configuration SMTP manquante. Vérifiez les variables d'environnement.",
		});
		expect(sendMailMock).not.toHaveBeenCalled();
	});

	it("sends email using smtp configuration", async () => {
		process.env.SMTP_USER = "no-reply@willisback.fr";
		process.env.SMTP_PASSWORD = "secret";
		process.env.CONTACT_EMAIL_TO = "william.derue@gmail.com";
		sendMailMock.mockResolvedValueOnce({});

		const formData = new FormData();
		formData.set("email", "john@example.com");
		formData.set("sujet", "Sujet valide");
		formData.set("message", "Message assez long pour passer la validation.");

		const result = await sendEmail(null, formData);

		expect(result).toEqual({ success: true });
		expect(sendMailMock).toHaveBeenCalledWith(
			expect.objectContaining({
				from: "Portfolio <no-reply@willisback.fr>",
				to: "william.derue@gmail.com",
				subject: "[Portfolio] Sujet valide",
				replyTo: "john@example.com",
			}),
		);
	});
});
