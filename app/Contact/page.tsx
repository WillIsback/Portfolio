"use client";
import { motion } from "framer-motion";
import { Loader2, Send, UserRoundPen } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { z } from "zod";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import { useFormValidation } from "@/hooks/useFormValidation";
import { sendEmail } from "../actions/contact.action";

// Schéma de validation
const formSchema = z.object({
	email: z.string().email("Adresse email invalide"),
	sujet: z.string().min(3, "Le sujet doit faire au moins 3 caractères"),
	message: z.string().min(10, "Le message doit faire au moins 10 caractères"),
});

const initialFormValues = { email: "", sujet: "", message: "" };

export default function Contact() {
	const contactBtnRef = useRef<HTMLButtonElement>(null);
	const lastHandledState = useRef<typeof state>(null);
	const [state, formAction, isPending] = useActionState(sendEmail, null);

	const {
		formData,
		isValid,
		handleChange,
		handleBlur,
		resetForm,
		getFieldError,
		isFieldInvalid,
	} = useFormValidation({
		schema: formSchema,
		initialValues: initialFormValues,
	});

	// Gestion des réponses serveur
	useEffect(() => {
		// Éviter de traiter le même état plusieurs fois
		if (!state || state === lastHandledState.current) return;
		lastHandledState.current = state;

		if (state.success) {
			toast.success("Message envoyé !", {
				description:
					"Votre message a bien été envoyé. Je vous répondrai rapidement.",
			});
			resetForm();
		}

		if (state.error) {
			if (typeof state.error === "string") {
				toast.error("Erreur d'envoi", {
					description: state.error,
				});
			} else {
				toast.error("Erreurs de validation", {
					description: "Veuillez vérifier les champs du formulaire.",
				});
			}
		}
	}, [state, resetForm]);

	return (
		<main className="relative min-h-screen flex flex-col bg-background">
			<div className="sticky top-0 z-50 flex w-full justify-center p-3 sm:p-6">
				<Header highlightContact={false} contactBtnRef={contactBtnRef} />
			</div>
			<div className="mx-auto w-full min-w-3/5 max-w-6xl px-4 sm:w-auto">
				<div className="mb-20 flex items-center gap-4 sm:gap-8">
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.6 }}
						className="shrink-0"
					></motion.div>
					<UserRoundPen size={75} />
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className="space-y-4"
					>
						<h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-foreground">
							Formulaire de contact
						</h1>
					</motion.div>
				</div>
				<form
					action={formAction}
					className="flex flex-col gap-6 border border-border bg-card rounded-xl px-6 py-8 sm:px-13 sm:py-13 w-full"
				>
					<div className="mb-6">
						<label
							htmlFor="email"
							className="block mb-2.5 text-sm font-medium text-foreground"
						>
							Adresse mail
						</label>
						<input
							type="email"
							id="email"
							name="email"
							value={formData.email}
							onChange={handleChange}
							onBlur={handleBlur}
							className={`bg-background border text-foreground text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring block w-full px-3 py-2.5 shadow-xs placeholder:text-muted-foreground transition-colors ${
								isFieldInvalid("email")
									? "border-destructive focus:ring-destructive/40 focus:border-destructive"
									: "border-input"
							}`}
							placeholder="john.doe@company.com"
							required
						/>
						{getFieldError("email") && (
							<motion.p
								initial={{ opacity: 0, y: -5 }}
								animate={{ opacity: 1, y: 0 }}
								className="mt-1.5 text-xs text-destructive"
							>
								{getFieldError("email")}
							</motion.p>
						)}
					</div>

					<div className="mb-6">
						<label
							htmlFor="sujet"
							className="block mb-2.5 text-sm font-medium text-foreground"
						>
							Sujet
						</label>
						<input
							type="text"
							id="sujet"
							name="sujet"
							value={formData.sujet}
							onChange={handleChange}
							onBlur={handleBlur}
							className={`bg-background border text-foreground text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring block w-full px-3 py-2.5 shadow-xs placeholder:text-muted-foreground transition-colors ${
								isFieldInvalid("sujet")
									? "border-destructive focus:ring-destructive/40 focus:border-destructive"
									: "border-input"
							}`}
							placeholder="Sujet du mail..."
							required
						/>
						{getFieldError("sujet") && (
							<motion.p
								initial={{ opacity: 0, y: -5 }}
								animate={{ opacity: 1, y: 0 }}
								className="mt-1.5 text-xs text-destructive"
							>
								{getFieldError("sujet")}
							</motion.p>
						)}
					</div>

					<div className="mb-6">
						<label
							htmlFor="message"
							className="block mb-2.5 text-sm font-medium text-foreground"
						>
							Message
						</label>
						<textarea
							id="message"
							name="message"
							rows={8}
							value={formData.message}
							onChange={handleChange}
							onBlur={handleBlur}
							className={`bg-background border text-foreground text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring block w-full p-3.5 shadow-xs placeholder:text-muted-foreground transition-colors ${
								isFieldInvalid("message")
									? "border-destructive focus:ring-destructive/40 focus:border-destructive"
									: "border-input"
							}`}
							placeholder="Votre message..."
						/>
						{getFieldError("message") && (
							<motion.p
								initial={{ opacity: 0, y: -5 }}
								animate={{ opacity: 1, y: 0 }}
								className="mt-1.5 text-xs text-destructive"
							>
								{getFieldError("message")}
							</motion.p>
						)}
					</div>

					<button
						type="submit"
						disabled={isPending || !isValid}
						className="group flex items-center gap-2 border rounded-xl px-4 py-2 bg-secondary text-secondary-foreground cursor-pointer w-fit hover:bg-primary hover:text-primary-foreground transition-colors duration-300 ease-in-out hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-secondary disabled:hover:text-secondary-foreground"
					>
						{isPending ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								<span className="text-sm">Envoi...</span>
							</>
						) : (
							<>
								<span className="text-sm">Envoyer</span>
								<Send className="size-4" />
							</>
						)}
					</button>
				</form>
			</div>
			<Footer />
		</main>
	);
}
