/* eslint-disable @next/next/no-img-element -- vignettes distantes, hôte non configuré pour next/image */
"use client";

import { useState, useTransition } from "react";
import { listRepoImages } from "@/app/actions/admin.action";

const BTN =
	"text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400";

export function ImagePicker({
	projectId,
	isPrivate,
	value,
	onChange,
}: {
	projectId: number;
	isPrivate: boolean;
	value: string;
	onChange: (value: string) => void;
}) {
	const [images, setImages] = useState<string[] | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	function load() {
		startTransition(async () => {
			const res = await listRepoImages(projectId);
			setImages(res.images);
			setMessage(
				res.ok
					? res.images.length === 0
						? "Aucune image trouvée dans le dépôt."
						: null
					: res.reason,
			);
		});
	}

	const isRepoImage = value.startsWith("https://raw.githubusercontent.com/");

	return (
		<div>
			<p className="text-xs text-zinc-500 mb-1">Capture</p>
			{isPrivate ? (
				<p className="text-xs text-zinc-500">
					Capture impossible pour un dépôt privé
				</p>
			) : (
				<div className="flex flex-wrap items-center gap-3">
					<button
						type="button"
						onClick={load}
						disabled={isPending}
						className={BTN}
					>
						{isPending ? "Chargement…" : "Choisir dans le dépôt"}
					</button>
					{isRepoImage ? (
						<button type="button" onClick={() => onChange("")} className={BTN}>
							Retirer
						</button>
					) : null}
				</div>
			)}
			{isRepoImage ? (
				<p className="mt-1 break-all text-[11px] text-zinc-600">{value}</p>
			) : null}
			{message ? (
				<output className="mt-2 block text-xs text-zinc-500">{message}</output>
			) : null}
			{images && images.length > 0 ? (
				<ul
					aria-label="Images du dépôt"
					className="mt-3 grid list-none grid-cols-3 gap-2 p-0 sm:grid-cols-4"
				>
					{images.map((url) => (
						<li key={url}>
							<button
								type="button"
								aria-pressed={url === value}
								aria-label={`Choisir ${decodeURIComponent(url.split("/").pop() ?? "")}`}
								onClick={() => onChange(url)}
								className={`block w-full overflow-hidden rounded border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
									url === value ? "border-zinc-200" : "border-zinc-800"
								}`}
							>
								{/* biome-ignore lint/performance/noImgElement: vignettes distantes, hôte non configuré pour next/image */}
								<img
									src={url}
									alt=""
									loading="lazy"
									className="aspect-video w-full object-cover"
								/>
							</button>
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}
