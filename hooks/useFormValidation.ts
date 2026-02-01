import { useMemo, useState } from "react";
import type { z } from "zod";

type FormErrors<T> = Partial<Record<keyof T, string>>;

interface UseFormValidationOptions<T extends Record<string, unknown>> {
	schema: z.ZodSchema<T>;
	initialValues: T;
}

export function useFormValidation<T extends Record<string, unknown>>({
	schema,
	initialValues,
}: UseFormValidationOptions<T>) {
	const [formData, setFormData] = useState<T>(initialValues);
	const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

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

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleBlur = (
		e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name } = e.target;
		setTouched((prev) => ({ ...prev, [name]: true }));
	};

	const resetForm = () => {
		setFormData(initialValues);
		setTouched({});
	};

	const getFieldError = (field: keyof T): string | undefined => {
		return touched[field] ? errors[field] : undefined;
	};

	const isFieldInvalid = (field: keyof T): boolean => {
		return Boolean(touched[field] && errors[field]);
	};

	return {
		formData,
		errors,
		isValid,
		touched,
		handleChange,
		handleBlur,
		resetForm,
		getFieldError,
		isFieldInvalid,
	};
}
