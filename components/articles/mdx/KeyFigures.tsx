import { cn } from "@/lib/utils";

export interface KeyFigure {
	value: string;
	label: string;
	alert?: boolean;
}

export function KeyFigures({ items }: Readonly<{ items: KeyFigure[] }>) {
	return (
		<dl className="my-10 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
			{items.map((item) => (
				<div
					key={`${item.value}-${item.label}`}
					className={cn(
						"flex flex-col-reverse justify-end gap-1.5 rounded-xl border bg-card p-4 shadow-sm",
						item.alert
							? "border-primary/40 bg-linear-to-br from-primary/10 to-card"
							: "border-border",
					)}
				>
					<dt className="text-sm leading-snug text-muted-foreground">
						{item.label}
					</dt>
					<dd
						className={cn(
							"font-display text-3xl font-bold tracking-tight tabular-nums",
							item.alert ? "text-primary" : "text-foreground",
						)}
					>
						{item.value}
					</dd>
				</div>
			))}
		</dl>
	);
}
