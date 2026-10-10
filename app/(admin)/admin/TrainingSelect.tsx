"use client";

import {
	isTraining,
	TRAINING_LABELS,
	TRAININGS,
	type Training,
} from "@/lib/training";

/** Parcours OpenClassrooms ; `hint` affiche l'indice tiré du nom du dépôt (jamais de déduction). */
export function TrainingSelect({
	id,
	value,
	onChange,
	hint,
	className = "",
}: {
	id: string;
	value: Training | null;
	onChange: (value: Training | null) => void;
	hint: boolean;
	className?: string;
}) {
	return (
		<div>
			<label htmlFor={id} className="text-xs text-zinc-500 block mb-1">
				Formation
			</label>
			<select
				id={id}
				className={className}
				value={value ?? ""}
				aria-describedby={hint ? `${id}-hint` : undefined}
				onChange={(e) =>
					onChange(isTraining(e.target.value) ? e.target.value : null)
				}
			>
				<option value="">Aucune</option>
				{TRAININGS.map((t) => (
					<option key={t} value={t}>
						{TRAINING_LABELS[t]}
					</option>
				))}
			</select>
			{hint ? (
				<p id={`${id}-hint`} className="mt-1 text-xs text-amber-400">
					Ressemble à un projet OpenClassrooms : choisis le parcours si
					c&apos;est le cas.
				</p>
			) : null}
		</div>
	);
}
