"use server";

import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

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
		await resend.emails.send({
			from: "Contact <onboarding@resend.dev>", // Utilise ton domaine verifié en prod
			to: "william.derue@gmail.com",
			subject: `[Portfolio] ${validatedFields.data.sujet}`,
			text: `De: ${validatedFields.data.email}\n\n${validatedFields.data.message}`,
			replyTo: validatedFields.data.email,
		});

		return { success: true };
	} catch (error) {
		return { error: `Erreur lors de l'envoi. : ${error}` };
	}
}
