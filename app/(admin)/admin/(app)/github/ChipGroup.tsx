"use client";

/** Groupe de cases à cocher « pastilles » (étiquetées, focus visible). */
export function ChipGroup({
	legend,
	options,
	selected,
	onToggle,
	labels,
}: {
	legend: string;
	options: readonly string[];
	selected: readonly string[];
	onToggle: (value: string) => void;
	labels?: Record<string, string>;
}) {
	return (
		<fieldset>
			<legend className="text-xs text-zinc-500 mb-1.5">{legend}</legend>
			<div className="flex flex-wrap gap-2">
				{options.map((opt) => (
					<label
						key={opt}
						className={`flex items-center text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-zinc-300 ${
							selected.includes(opt)
								? "border-zinc-400 text-zinc-200 bg-zinc-800"
								: "border-zinc-700 text-zinc-500"
						}`}
					>
						<input
							type="checkbox"
							className="sr-only"
							checked={selected.includes(opt)}
							onChange={() => onToggle(opt)}
						/>
						{labels?.[opt] ?? opt}
					</label>
				))}
			</div>
		</fieldset>
	);
}
