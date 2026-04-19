"use server";

import nodemailer from "nodemailer";
import { z } from "zod";

// Schéma de validation
const schema = z.object({
	email: z.email("Adresse email invalide"),
	sujet: z.string().min(3, "Le sujet doit faire au moins 3 caractères"),
	message: z.string().min(10, "Le message doit faire au moins 10 caractères"),
});

export async function sendEmail(_prevState: unknown, formData: FormData) {
	const validatedFields = schema.safeParse({
		email: formData.get("email"),
		sujet: formData.get("sujet"),
		message: formData.get("message"),
	});

	if (!validatedFields.success) {
		return { error: validatedFields.error.flatten().fieldErrors };
	}

	try {
		if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
			return {
				error: "Configuration SMTP manquante. Vérifiez les variables d'environnement.",
			};
		}

		const transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST || "smtp.hostinger.com",
			port: Number(process.env.SMTP_PORT || 465),
			secure: true,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASSWORD,
			},
		});

		await transporter.sendMail({
			from: process.env.SMTP_FROM || "Portfolio <no-reply@willisback.fr>",
			to: process.env.CONTACT_EMAIL_TO || "william.derue@gmail.com",
			subject: `[Portfolio] ${validatedFields.data.sujet}`,
			text: `De: ${validatedFields.data.email}\n\n${validatedFields.data.message}`,
			replyTo: validatedFields.data.email as string,
		});

		return { success: true };
	} catch (error) {
		return { error: `Erreur lors de l'envoi. : ${error}` };
	}
}
