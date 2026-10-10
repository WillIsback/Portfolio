import { useCallback, useMemo, useState } from "react";
import type { z } from "zod";

type FormErrors<T> = Partial<Record<keyof T, string>>;

interface UseFormValidationOptions<T extends Record<string, unknown>> {
	schema: z.ZodSchema<T>;
	initialValues: T;
	/** Erreurs renvoyées par le serveur (une par champ), affichées même sans interaction. */
	serverErrors?: FormErrors<T>;
}

export function useFormValidation<T extends Record<string, unknown>>({
	schema,
	initialValues,
	serverErrors: serverErrorsProp,
}: UseFormValidationOptions<T>) {
	const [formData, setFormData] = useState<T>(initialValues);
	const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
	const [submitted, setSubmitted] = useState(false);
	// Champs corrigés depuis la dernière réponse serveur : leur erreur serveur ne s'affiche plus.
	const [dismissed, setDismissed] = useState<Partial<Record<keyof T, boolean>>>(
		{},
	);
	const [seenServerErrors, setSeenServerErrors] = useState(serverErrorsProp);

	// Une nouvelle réponse serveur remplace la précédente : on repart des erreurs fraîches.
	// (Ajustement pendant le rendu : la réponse serveur est un « état externe » qui vient d'arriver.)
	if (seenServerErrors !== serverErrorsProp) {
		setSeenServerErrors(serverErrorsProp);
		setDismissed({});
	}

	// Validation calculée (pas de setState dans useEffect)
	const { errors, isValid } = useMemo(() => {
		const result = schema.safeParse(formData);

		if (result.success) {
			return { errors: {} as FormErrors<T>, isValid: true };
		}

		const fieldErrors: FormErrors<T> = {};
		for (const issue of result.error.issues) {
			const field = issue.path[0] as keyof T;
			if (!fieldErrors[field]) {
				fieldErrors[field] = issue.message;
			}
		}
		return { errors: fieldErrors, isValid: false };
	}, [formData, schema]);

	// Erreurs affichées : le serveur prime ; sinon le client, une fois le champ touché ou l'envoi tenté.
	const displayedErrors = useMemo(() => {
		const shown: FormErrors<T> = {};
		for (const [field, message] of Object.entries(
			serverErrorsProp ?? {},
		) as [keyof T, string | undefined][]) {
			if (message && !dismissed[field]) shown[field] = message;
		}
		for (const field of Object.keys(errors) as (keyof T)[]) {
			if (!shown[field] && (submitted || touched[field])) {
				shown[field] = errors[field];
			}
		}
		return shown;
	}, [errors, serverErrorsProp, dismissed, submitted, touched]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		// Une saisie corrige l'erreur serveur du champ.
		setDismissed((prev) => ({ ...prev, [name as keyof T]: true }));
	};

	const handleBlur = (
		e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name } = e.target;
		setTouched((prev) => ({ ...prev, [name]: true }));
	};

	const resetForm = useCallback(() => {
		setFormData(initialValues);
		setTouched({});
		setSubmitted(false);
		setDismissed({});
	}, [initialValues]);

	/** Révèle toutes les erreurs de champ (au clic sur Envoyer, même sans avoir quitté un champ). */
	const showAllErrors = useCallback(() => setSubmitted(true), []);

	const getFieldError = (field: keyof T): string | undefined =>
		displayedErrors[field];

	const isFieldInvalid = (field: keyof T): boolean =>
		Boolean(displayedErrors[field]);

	return {
		formData,
		errors,
		isValid,
		touched,
		displayedErrors,
		handleChange,
		handleBlur,
		resetForm,
		showAllErrors,
		getFieldError,
		isFieldInvalid,
	};
}
