"use client";
import { Loader2, Send } from "lucide-react";
import {
	type FormEvent,
	useActionState,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import { z } from "zod";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import ThemedToaster from "@/components/theme/ThemedToaster";
import { useFormValidation } from "@/hooks/useFormValidation";
import { formatDateFr } from "@/lib/articles/format";
import {
	CONTACT_FIELDS,
	type ContactField,
	errorSummary,
	firstInvalidField,
	firstServerErrors,
} from "@/lib/contact-form";
import { sendEmail } from "../actions/contact.action";

// Schéma de validation
const formSchema = z.object({
	email: z.string().email("Adresse email invalide"),
	sujet: z.string().min(3, "Le sujet doit faire au moins 3 caractères"),
	message: z.string().min(10, "Le message doit faire au moins 10 caractères"),
});

const noopSubscribe = () => () => {};

/** Date du jour ISO (locale du visiteur) ; vide au rendu serveur et à l'hydratation, sans écart. */
function useToday(): string {
	return useSyncExternalStore(
		noopSubscribe,
		() => {
			const d = new Date();
			const pad = (n: number) => String(n).padStart(2, "0");
			return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
		},
		() => "",
	);
}

const initialFormValues = { email: "", sujet: "", message: "" };

export default function Contact() {
	const today = useToday();
	const lastHandledState = useRef<typeof state>(null);
	const [state, formAction, isPending] = useActionState(sendEmail, null);
	const [submitAnnouncement, setSubmitAnnouncement] = useState("");
	const fieldRefs = useRef<Record<ContactField, HTMLElement | null>>({
		email: null,
		sujet: null,
		message: null,
	});

	// Erreurs de champ renvoyées par le serveur (soumission sans JavaScript notamment).
	const serverErrors = useMemo(
		() =>
			state && "error" in state && state.error && typeof state.error === "object"
				? firstServerErrors(
						state.error as Partial<Record<ContactField, string[]>>,
					)
				: {},
		[state],
	);

	// Résumé annoncé : celui de la tentative côté client prime, sinon celui du serveur.
	const serverAnnouncement = useMemo(
		() => errorSummary(Object.keys(serverErrors).length),
		[serverErrors],
	);
	const announcement = submitAnnouncement || serverAnnouncement;

	const {
		formData,
		errors,
		isValid,
		handleChange,
		handleBlur,
		resetForm,
		showAllErrors,
		getFieldError,
		isFieldInvalid,
	} = useFormValidation({
		schema: formSchema,
		initialValues: initialFormValues,
		serverErrors,
	});

	const focusField = useCallback((field: ContactField | null) => {
		if (field) fieldRefs.current[field]?.focus();
	}, []);

	// Gestion des réponses serveur
	useEffect(() => {
		// Éviter de traiter le même état plusieurs fois
		if (!state || state === lastHandledState.current) return;
		lastHandledState.current = state;

		if ("success" in state && state.success) {
			toast.success("Message envoyé !", {
				description:
					"Votre message a bien été envoyé. Je vous répondrai rapidement.",
			});
			resetForm();
			return;
		}

		if ("error" in state && state.error) {
			if (typeof state.error === "string") {
				toast.error("Erreur d'envoi", {
					description: state.error,
				});
				return;
			}
			toast.error("Erreurs de validation", {
				description: "Veuillez vérifier les champs du formulaire.",
			});
			const serverFieldErrors = firstServerErrors(
				state.error as Partial<Record<ContactField, string[]>>,
			);
			focusField(firstInvalidField(CONTACT_FIELDS, serverFieldErrors));
		}
	}, [state, resetForm, focusField]);

	// Le bouton reste actif : au clic invalide, on montre toutes les erreurs et on guide le visiteur.
	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		if (isValid) {
			setSubmitAnnouncement("");
			return;
		}
		e.preventDefault();
		showAllErrors();
		setSubmitAnnouncement(errorSummary(Object.keys(errors).length));
		focusField(firstInvalidField(CONTACT_FIELDS, errors));
	};

	return (
		<main className="relative min-h-screen flex flex-col">
			<div className="sticky top-0 z-50 w-full">
				<Header />
			</div>
			<div className="mx-auto w-full min-w-3/5 max-w-6xl px-4 pt-10 sm:w-auto">
				<header className="mb-10 space-y-3">
					<p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
						Carnet · fiche contact
					</p>
					<h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-foreground">
						Formulaire de contact
					</h1>
					<p className="text-muted-foreground">
						Une question sur un projet, une expérience ou un article ? Je
						réponds sous quelques jours.
					</p>
				</header>
				<form
					action={formAction}
					onSubmit={handleSubmit}
					noValidate
					className="flex flex-col gap-6 border border-border bg-background/80 rounded-sm px-6 py-8 sm:px-10 sm:py-10 w-full"
				>
					<div className="flex items-baseline justify-between gap-4 border-b border-border pb-3 font-mono text-xs text-ink-soft">
						<span>Fiche n° — à remplir</span>
						<time dateTime={today || undefined} suppressHydrationWarning>
							{today ? formatDateFr(today) : ""}
						</time>
					</div>
					<p aria-live="polite" className="sr-only">
						{announcement}
					</p>
					<div className="mb-6">
						<label
							htmlFor="email"
							className="block mb-2 font-mono text-xs uppercase tracking-[0.12em] text-ink-soft"
						>
							Adresse mail
						</label>
						<input
							ref={(el) => {
								fieldRefs.current.email = el;
							}}
							type="email"
							id="email"
							name="email"
							value={formData.email}
							onChange={handleChange}
							onBlur={handleBlur}
							className={`block w-full border-0 border-b rounded-none bg-transparent px-1 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
								isFieldInvalid("email")
									? "border-destructive focus:border-destructive"
									: "border-ink-soft focus:border-primary"
							}`}
							aria-invalid={isFieldInvalid("email")}
							aria-describedby={
								getFieldError("email") ? "email-error" : undefined
							}
							placeholder="john.doe@company.com"
							required
						/>
						{getFieldError("email") && (
							<p
								id="email-error"
								role="alert"
								className="mt-1.5 text-xs text-destructive"
							>
								{getFieldError("email")}
							</p>
						)}
					</div>

					<div className="mb-6">
						<label
							htmlFor="sujet"
							className="block mb-2 font-mono text-xs uppercase tracking-[0.12em] text-ink-soft"
						>
							Sujet
						</label>
						<input
							ref={(el) => {
								fieldRefs.current.sujet = el;
							}}
							type="text"
							id="sujet"
							name="sujet"
							value={formData.sujet}
							onChange={handleChange}
							onBlur={handleBlur}
							className={`block w-full border-0 border-b rounded-none bg-transparent px-1 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
								isFieldInvalid("sujet")
									? "border-destructive focus:border-destructive"
									: "border-ink-soft focus:border-primary"
							}`}
							aria-invalid={isFieldInvalid("sujet")}
							aria-describedby={
								getFieldError("sujet") ? "sujet-error" : undefined
							}
							placeholder="Sujet du mail..."
							required
						/>
						{getFieldError("sujet") && (
							<p
								id="sujet-error"
								role="alert"
								className="mt-1.5 text-xs text-destructive"
							>
								{getFieldError("sujet")}
							</p>
						)}
					</div>

					<div className="mb-6">
						<label
							htmlFor="message"
							className="block mb-2 font-mono text-xs uppercase tracking-[0.12em] text-ink-soft"
						>
							Message
						</label>
						<textarea
							ref={(el) => {
								fieldRefs.current.message = el;
							}}
							id="message"
							name="message"
							rows={8}
							value={formData.message}
							onChange={handleChange}
							onBlur={handleBlur}
							className={`block w-full border-0 border-b rounded-none bg-transparent px-1 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
								isFieldInvalid("message")
									? "border-destructive focus:border-destructive"
									: "border-ink-soft focus:border-primary"
							}`}
							aria-invalid={isFieldInvalid("message")}
							aria-describedby={
								getFieldError("message") ? "message-error" : undefined
							}
							placeholder="Votre message..."
						/>
						{getFieldError("message") && (
							<p
								id="message-error"
								role="alert"
								className="mt-1.5 text-xs text-destructive"
							>
								{getFieldError("message")}
							</p>
						)}
					</div>

					<button
						type="submit"
						disabled={isPending}
						className="group flex w-fit cursor-pointer items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
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
			<ThemedToaster />
		</main>
	);
}
