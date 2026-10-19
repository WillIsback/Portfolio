"use client";

export interface LocaleSelectProps {
	id: string;
	/** Code de la langue active. */
	value: string;
	locales: readonly string[];
	/** Libellé traduit de chaque langue, indexé par code. */
	labels: Record<string, string>;
	/** Texte du `<label>` masqué et de `aria-label`. */
	label: string;
	disabled?: boolean;
	onChange: (locale: string) => void;
}

export default function LocaleSelect({
	id,
	value,
	locales,
	labels,
	label,
	disabled,
	onChange,
}: LocaleSelectProps) {
	return (
		<>
			<label htmlFor={id} className="sr-only">
				{label}
			</label>
			<select
				id={id}
				value={value}
				disabled={disabled}
				aria-label={label}
				onChange={(event) => onChange(event.target.value)}
				className="rounded-none border border-border/70 bg-background px-1.5 py-1 font-mono text-xs text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				{locales.map((code) => (
					// `lang` fait annoncer « English » et « 中文 » avec leur phonétique
					// d'origine sur une page française, au lieu de la prononciation du
					// lecteur d'écran.
					<option key={code} value={code} lang={code}>
						{labels[code]}
					</option>
				))}
			</select>
		</>
	);
}
