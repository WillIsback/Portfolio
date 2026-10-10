import { PRACTICE_LABELS, practicesByFamily } from "@/lib/practices";

/** Pratiques par famille : une ligne par famille (`full`) ou les seules familles (`compact`). */
export default function PracticeMarks({
	practices,
	variant,
	className = "",
}: Readonly<{
	practices: { practice: string }[];
	variant: "full" | "compact";
	className?: string;
}>) {
	const groups = practicesByFamily(practices.map((p) => p.practice));
	if (groups.length === 0) return null;
	const line = (g: (typeof groups)[number]) =>
		`${g.family} — ${g.practices.map((p) => PRACTICE_LABELS[p]).join(", ")}`;
	if (variant === "compact") {
		const full = groups.map(line).join(" ; ");
		return (
			<span title={full} className={className}>
				<span aria-hidden="true">
					{groups.map((g) => g.family).join(" · ")}
				</span>
				<span className="sr-only">Pratiques : {full}</span>
			</span>
		);
	}
	return (
		<ul
			aria-label="Pratiques"
			className={`m-0 list-none p-0 font-mono text-[11px] text-ink-soft ${className}`}
		>
			{groups.map((g) => (
				<li key={g.family}>
					<span className="text-ink">{g.family}</span> —{" "}
					{g.practices.map((p) => PRACTICE_LABELS[p]).join(", ")}
				</li>
			))}
		</ul>
	);
}
