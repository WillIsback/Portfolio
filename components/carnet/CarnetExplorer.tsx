"use client";

import {
	type ReactNode,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from "react";
import FigureCaption from "@/components/notebook/FigureCaption";
import {
	announcement,
	computeView,
	explorerReducer,
	initialExplorerState,
} from "@/lib/carnet/explorer";
import {
	type MapCluster,
	type MapPoint,
	toPercent,
} from "@/lib/carnet/map-view";
import { formatScore, type SearchItem } from "@/lib/carnet/search";
import type {
	WorkerRequest,
	WorkerResponse,
} from "@/lib/carnet/worker-protocol";
import { cn } from "@/lib/utils";
import MapItemList from "./MapItemList";
import MapLegend from "./MapLegend";
import MapSvg from "./MapSvg";

interface CarnetExplorerProps {
	points: MapPoint[];
	clusters: MapCluster[];
	searchItems: SearchItem[];
	intro: ReactNode;
	note: ReactNode;
}

const ANNOUNCE_DELAY_MS = 300;

const isExternal = (href: string) => href.startsWith("http");

/** Fig. 1 (spec §6.2, §7.4) : saisie, carte, résultats. Seul îlot client de l'accueil. */
export default function CarnetExplorer({
	points,
	clusters,
	searchItems,
	intro,
	note,
}: Readonly<CarnetExplorerProps>) {
	const [state, dispatch] = useReducer(explorerReducer, initialExplorerState);
	const [hoverId, setHoverId] = useState<string | null>(null);
	const workerRef = useRef<Worker | null>(null);

	const positions = useMemo(
		() => new Map(points.map((p) => [p.id, { x: p.x, y: p.y }])),
		[points],
	);
	const byId = useMemo(() => new Map(points.map((p) => [p.id, p])), [points]);
	const view = computeView(state, searchItems, positions);

	const activate = () => {
		if (workerRef.current || state.status !== "idle") return;
		dispatch({ type: "activate" });
		try {
			const worker = new Worker(
				new URL("../../lib/carnet/carnet.worker.ts", import.meta.url),
				{ type: "module" },
			);
			worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
				const message = event.data;
				if (message.type === "ready") dispatch({ type: "ready" });
				else if (message.type === "error") dispatch({ type: "failed" });
				else
					dispatch({
						type: "result",
						seq: message.seq,
						ranked: message.ranked,
					});
			};
			worker.onerror = () => dispatch({ type: "failed" });
			workerRef.current = worker;
			worker.postMessage({ type: "init" } satisfies WorkerRequest);
		} catch {
			dispatch({ type: "failed" });
		}
	};

	// Seul endroit qui interroge le Worker : à chaque saisie, et quand le modèle devient prêt.
	useEffect(() => {
		if (state.status === "ready" && state.query.trim())
			workerRef.current?.postMessage({
				type: "query",
				seq: state.seq,
				text: state.query,
			} satisfies WorkerRequest);
	}, [state.status, state.seq, state.query]);

	useEffect(() => () => workerRef.current?.terminate(), []);

	const summary = announcement(
		view.results.flatMap((r) => byId.get(r.id)?.title ?? []),
		view.mode !== "rest",
	);
	const [announced, setAnnounced] = useState("");
	// N'annonce qu'une fois la saisie stable : pas de relecture à chaque frappe.
	useEffect(() => {
		const timer = setTimeout(() => setAnnounced(summary), ANNOUNCE_DELAY_MS);
		return () => clearTimeout(timer);
	}, [summary]);

	const tooltip = hoverId ? byId.get(hoverId) : undefined;

	return (
		<div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
			<div className="relative">
				{intro}
				<label
					htmlFor="carnet-query"
					className="mt-8 block font-mono text-xs uppercase tracking-[0.14em] text-ink-soft"
				>
					Explorer le carnet
				</label>
				<input
					id="carnet-query"
					type="search"
					autoComplete="off"
					spellCheck={false}
					value={state.query}
					placeholder="Décris un sujet : vision, LLM local, agents…"
					onFocus={activate}
					onPointerEnter={activate}
					onChange={(event) =>
						dispatch({ type: "input", query: event.target.value })
					}
					className="mt-2 w-full rounded-md border border-border bg-background/80 px-4 py-3 text-base shadow-sm placeholder:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				/>
				{note}
			</div>

			<div className="relative">
				<figure className="relative m-0">
					<div
						className="relative mx-auto aspect-square w-full max-w-[560px] lg:max-w-[min(560px,calc(100svh-20rem))]"
						onPointerDown={activate}
					>
						<MapSvg
							points={points}
							highlighted={view.hits}
							queryPoint={view.queryPoint}
							activeId={hoverId}
							onHover={setHoverId}
						/>
						{tooltip ? (
							<div
								className="pointer-events-none absolute z-10 max-w-[14rem] -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-sm border border-border bg-background px-2 py-1 font-mono text-[11px] leading-tight shadow-sm"
								style={{
									left: `${toPercent(tooltip.x)}%`,
									top: `${toPercent(tooltip.y)}%`,
								}}
							>
								<span className="block text-foreground">{tooltip.title}</span>
								<span className="text-ink-soft">
									{tooltip.kind === "article" ? "article" : "projet"}
								</span>
							</div>
						) : null}
					</div>
					<FigureCaption number={1}>
						Carte de mes projets et articles
					</FigureCaption>
				</figure>
				<MapLegend clusters={clusters} />

				<div aria-live="polite" className="sr-only">
					{announced}
				</div>
				<div className="mt-4 min-h-[5.5rem]">
					{view.mode !== "rest" && view.results.length === 0 ? (
						<p className="text-sm text-ink-soft">
							Aucun élément ne correspond. Essaie un autre mot.
						</p>
					) : null}
					{view.results.length > 0 ? (
						<ol className="space-y-1.5">
							{view.results.map((r) => {
								const p = byId.get(r.id);
								if (!p) return null;
								return (
									<li key={r.id} className="flex items-baseline gap-3">
										<span className="w-10 shrink-0 font-mono text-xs text-primary">
											{r.score === null ? (
												<>
													<span aria-hidden="true">≈</span>
													<span className="sr-only">
														correspondance par mot-clé
													</span>
												</>
											) : (
												formatScore(r.score)
											)}
										</span>
										<a
											href={p.href}
											target={isExternal(p.href) ? "_blank" : undefined}
											rel={
												isExternal(p.href) ? "noopener noreferrer" : undefined
											}
											className="min-w-0 truncate rounded-sm font-display font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										>
											{p.title}
										</a>
										<span className="shrink-0 font-mono text-[11px] text-ink-soft">
											{p.kind === "article" ? "article" : "projet"}
										</span>
									</li>
								);
							})}
						</ol>
					) : null}
				</div>
				<p
					className={cn(
						"mt-2 font-mono text-[11px] text-ink-soft",
						state.status !== "ready" && "invisible",
					)}
				>
					recherche sémantique active
				</p>
				<MapItemList points={points} onFocusItem={setHoverId} />
			</div>
		</div>
	);
}
