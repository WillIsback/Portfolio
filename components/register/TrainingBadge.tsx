import { isTraining, trainingBadge, trainingBadgeShort } from "@/lib/training";

/** Tampon « projet de formation » : complet, ou abrégé avec le texte complet pour lecteur d'écran. */
export default function TrainingBadge({
	training,
	short = false,
	className = "",
}: Readonly<{ training: string | null; short?: boolean; className?: string }>) {
	if (!isTraining(training)) return null;
	const full = trainingBadge(training);
	return (
		<span
			title={short ? full : undefined}
			className={`inline-block rounded-sm border border-dashed border-ink-soft/60 px-1.5 py-0.5 font-mono text-[10px] uppercase leading-none tracking-wide text-ink-soft ${className}`}
		>
			{short ? (
				<>
					<span aria-hidden="true">{trainingBadgeShort(training)}</span>
					<span className="sr-only">{full}</span>
				</>
			) : (
				full
			)}
		</span>
	);
}
