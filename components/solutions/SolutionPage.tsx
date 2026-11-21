import { ArrowUpRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { KeyFigures } from "@/components/articles/mdx/KeyFigures";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { SolutionCopy, SolutionFacts } from "@/lib/solutions";
import CorrectionDemo from "./CorrectionDemo";
import ProductVisual from "./ProductVisual";

function Section({
	id,
	title,
	children,
}: Readonly<{ id: string; title: string; children: ReactNode }>) {
	return (
		<section aria-labelledby={id} className="mt-16">
			<h2
				id={id}
				className="font-display text-2xl font-bold tracking-tight text-foreground"
			>
				{title}
			</h2>
			<div className="mt-6">{children}</div>
		</section>
	);
}

function Actions({ facts }: Readonly<{ facts: SolutionFacts }>) {
	const t = useTranslations("solutions");
	return (
		<div className="flex flex-wrap items-center gap-3">
			<Button asChild>
				<a href={facts.site} target="_blank" rel="noopener">
					{t("visit", { site: facts.siteLabel })}
					<ArrowUpRight aria-hidden="true" />
				</a>
			</Button>
			<Button asChild variant="outline">
				<a href={facts.github} target="_blank" rel="noopener noreferrer">
					{t("source")}
				</a>
			</Button>
			<Link
				href={`/articles/${facts.articleSlug}`}
				className="rounded-sm px-1 font-mono text-xs text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			>
				{t("readArticle")}
			</Link>
		</div>
	);
}

/** Page produit d'une solution : promesse, visuel, usages, données, chiffres, limites. */
export default function SolutionPage({
	facts,
	copy,
}: Readonly<{ facts: SolutionFacts; copy: SolutionCopy }>) {
	const t = useTranslations("solutions");
	const visual = facts.visual;
	return (
		<article className="mx-auto max-w-4xl">
			<header className="space-y-5">
				<p className="font-mono text-sm text-ink-soft">
					<Link
						href="/solutions"
						className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						{t("eyebrow")}
					</Link>
					<span aria-hidden="true"> / </span>
					<span>{copy.status}</span>
				</p>
				<h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
					{facts.name}
				</h1>
				<p className="max-w-3xl text-xl font-medium text-primary sm:text-2xl">
					{copy.tagline}
				</p>
				<p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
					{copy.summary}
				</p>
				<Actions facts={facts} />
			</header>

			<div className="mt-12">
				{visual.kind === "screenshot" ? (
					<ProductVisual
						visual={visual}
						alt={copy.visualAlt}
						caption={copy.visualCaption}
					/>
				) : copy.demo ? (
					<CorrectionDemo
						demo={copy.demo}
						label={t("demoLabel")}
						caption={copy.visualCaption}
					/>
				) : null}
			</div>

			<Section id="for-who" title={t("forWho")}>
				<ul className="grid gap-4 sm:grid-cols-2">
					{copy.audience.map((a) => (
						<li key={a.title} className="rounded-xl border border-border p-5">
							<h3 className="font-display font-semibold">{a.title}</h3>
							<p className="mt-1.5 leading-relaxed text-muted-foreground">
								{a.text}
							</p>
						</li>
					))}
				</ul>
			</Section>

			<Section id="features" title={t("features")}>
				<ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
					{copy.features.map((f, i) => (
						<li key={f.title} className="flex gap-4">
							<span
								aria-hidden="true"
								className="font-mono text-sm text-primary tabular-nums"
							>
								{String(i + 1).padStart(2, "0")}
							</span>
							<div>
								<h3 className="font-display font-semibold">{f.title}</h3>
								<p className="mt-1 leading-relaxed text-muted-foreground">
									{f.text}
								</p>
							</div>
						</li>
					))}
				</ol>
			</Section>

			<Section id="privacy" title={t("privacy")}>
				<ul className="space-y-3">
					{copy.privacy.map((line) => (
						<li key={line} className="flex gap-3 leading-relaxed">
							<Check
								aria-hidden="true"
								className="mt-1 size-4 shrink-0 text-primary"
							/>
							<span>{line}</span>
						</li>
					))}
				</ul>
			</Section>

			<Section id="figures" title={t("figures")}>
				<KeyFigures items={copy.figures} />
			</Section>

			<Section id="under-the-hood" title={t("under")}>
				<p className="leading-relaxed">{copy.stack}</p>
				<p className="mt-3 font-mono text-xs text-ink-soft">
					{t("license", { license: facts.license })} · v{facts.version}
				</p>
			</Section>

			<Section id="limits" title={t("limits")}>
				<ul className="list-disc space-y-2 pl-5 leading-relaxed marker:text-ink-soft">
					{copy.limits.map((line) => (
						<li key={line}>{line}</li>
					))}
				</ul>
			</Section>

			<footer className="mt-16 space-y-6 border-t border-border pt-8">
				<Actions facts={facts} />
				<Link
					href="/solutions"
					className="inline-block rounded-sm font-mono text-xs text-ink-soft underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					← {t("allSolutions")}
				</Link>
			</footer>
		</article>
	);
}
