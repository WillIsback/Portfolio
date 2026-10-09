import Image from "next/image";
import { INSTRUMENTS } from "@/lib/instruments";
import { invertOnDark } from "@/lib/theme-icons";
import { cn } from "@/lib/utils";

/** Instruments (spec §6.5) : une ligne par domaine, détail derrière une divulgation. */
export default function Instruments() {
	return (
		<ul className="divide-y divide-border/70 border-y border-border/70">
			{INSTRUMENTS.map((instrument) => (
				<li
					key={instrument.id}
					className="grid gap-3 py-4 sm:grid-cols-[12rem_1fr]"
				>
					<h3 className="font-display text-base font-semibold">
						{instrument.title}
					</h3>
					<div>
						<ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
							{instrument.tools.map((tool) => (
								<li key={tool.name} className="flex items-center gap-2 text-sm">
									{tool.icon ? (
										<Image
											src={tool.icon}
											alt=""
											width={20}
											height={20}
											className={cn("size-5", invertOnDark(tool.icon))}
										/>
									) : null}
									{tool.name}
								</li>
							))}
						</ul>
						<details className="mt-2">
							<summary className="cursor-pointer rounded-sm font-mono text-[11px] text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
								voir le détail
							</summary>
							<dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
								<div>
									<dt className="font-mono text-[11px] text-ink-soft">
										Bibliothèques
									</dt>
									<dd>{instrument.libraries.join(", ")}</dd>
								</div>
								<div>
									<dt className="font-mono text-[11px] text-ink-soft">
										Utilitaires
									</dt>
									<dd>{instrument.utilities.join(", ")}</dd>
								</div>
							</dl>
						</details>
					</div>
				</li>
			))}
		</ul>
	);
}
