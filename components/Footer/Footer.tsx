import Link from "next/link";

export default function Footer() {
	return (
		<footer className="mt-16 w-full border-t border-border/70">
			<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 font-mono text-xs text-ink-soft sm:px-6">
				<p>Carnet tenu par William Derue · © {new Date().getFullYear()}</p>
				<nav
					aria-label="Liens du pied de page"
					className="flex items-center gap-4"
				>
					<Link
						href="/articles"
						className="rounded-sm hover:text-primary focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						Articles
					</Link>
					<Link
						href="https://github.com/WillIsback/"
						className="rounded-sm hover:text-primary focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						GitHub
					</Link>
				</nav>
			</div>
		</footer>
	);
}
