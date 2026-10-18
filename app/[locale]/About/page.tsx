import Chronology from "@/components/about/Chronology";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import { ageOn, PARCOURS } from "@/lib/about";

export const revalidate = 86400;

export default function About() {
	return (
		<main className="relative flex min-h-screen flex-col">
			<div className="sticky top-0 z-50 w-full">
				<Header />
			</div>

			<div className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-4xl">
					<header className="mb-16 space-y-3">
						<p className="font-mono text-sm text-ink-soft">Carnet · parcours</p>
						<h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
							William Derue
						</h1>
						<p className="text-xl font-medium text-primary">
							Développeur IA · parcours AI Engineer
						</p>
						<p className="text-lg text-muted-foreground">
							{ageOn(new Date())} ans — Sud de la France
						</p>
					</header>

					<Chronology steps={PARCOURS} />
				</div>
			</div>
			<Footer />
		</main>
	);
}
