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
		if (!state) return;

		const handleStateChange = () => {
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
		};

		handleStateChange();
	}, [state, resetForm]);

	return (
		<main className="relative min-h-screen flex flex-col bg-background">
			<div className="sticky top-0 z-50 p-6 flex justify-center w-full">
				<Header highlightContact={false} contactBtnRef={contactBtnRef} />
			</div>
			<div className="max-w-6xl mx-auto min-w-3/5">
				<div className="mb-20 flex items-center gap-8">
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
						<h1 className="text-5xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
							Formulaire de contact
						</h1>
					</motion.div>
				</div>
				<form
					action={formAction}
					className="flex flex-col gap-6 border border-gray-200 rounded-xl px-13 py-13 w-full"
				>
					<div className="mb-6">
						<label
							htmlFor="email"
							className="block mb-2.5 text-sm font-medium text-heading"
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
							className={`bg-neutral-secondary-medium border text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body transition-colors ${
								isFieldInvalid("email")
									? "border-red-500 focus:ring-red-500 focus:border-red-500"
									: "border-default-medium"
							}`}
							placeholder="john.doe@company.com"
							required
						/>
						{getFieldError("email") && (
							<motion.p
								initial={{ opacity: 0, y: -5 }}
								animate={{ opacity: 1, y: 0 }}
								className="mt-1.5 text-xs text-red-500"
							>
								{getFieldError("email")}
							</motion.p>
						)}
					</div>

					<div className="mb-6">
						<label
							htmlFor="sujet"
							className="block mb-2.5 text-sm font-medium text-heading"
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
							className={`bg-neutral-secondary-medium border text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body transition-colors ${
								isFieldInvalid("sujet")
									? "border-red-500 focus:ring-red-500 focus:border-red-500"
									: "border-default-medium"
							}`}
							placeholder="Sujet du mail..."
							required
						/>
						{getFieldError("sujet") && (
							<motion.p
								initial={{ opacity: 0, y: -5 }}
								animate={{ opacity: 1, y: 0 }}
								className="mt-1.5 text-xs text-red-500"
							>
								{getFieldError("sujet")}
							</motion.p>
						)}
					</div>

					<div className="mb-6">
						<label
							htmlFor="message"
							className="block mb-2.5 text-sm font-medium text-heading"
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
							className={`bg-neutral-secondary-medium border text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full p-3.5 shadow-xs placeholder:text-body transition-colors ${
								isFieldInvalid("message")
									? "border-red-500 focus:ring-red-500 focus:border-red-500"
									: "border-default-medium"
							}`}
							placeholder="Votre message..."
						/>
						{getFieldError("message") && (
							<motion.p
								initial={{ opacity: 0, y: -5 }}
								animate={{ opacity: 1, y: 0 }}
								className="mt-1.5 text-xs text-red-500"
							>
								{getFieldError("message")}
							</motion.p>
						)}
					</div>

					<button
						type="submit"
						disabled={isPending || !isValid}
						className="group flex items-center gap-2 border rounded-xl px-4 py-2 bg-gray-100 cursor-pointer w-fit hover:bg-gray-950 hover:text-white transition-colors duration-300 ease-in-out hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-gray-100 disabled:hover:text-inherit"
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
