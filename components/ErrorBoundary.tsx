"use client";

import { useTranslations } from "next-intl";
import { Component, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	/** Repli par défaut : reçoit l'erreur attrapée et la fonction de réessai. */
	renderFallback?: (error: Error | undefined, retry: () => void) => ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

/**
 * La frontière elle-même, sans aucun texte : une classe n'a pas de hooks, donc elle ne
 * peut pas lire le dictionnaire. Tout ce qui est affiché lui est passé par
 * `renderFallback`, construit plus bas dans un composant fonctionnel.
 */
class Catch extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			// `!= null` et non `!== undefined` : l'ancien code utilisait `??`, donc un
			// `fallback` à `null` retombait sur le repli traduit.
			if (this.props.fallback != null) return this.props.fallback;
			const { error } = this.state;
			return (
				this.props.renderFallback?.(error, () =>
					this.setState({ hasError: false, error: undefined }),
				) ?? null
			);
		}

		return this.props.children;
	}
}

/**
 * Frontière d'erreur du registre des projets.
 *
 * Ce composant est client (`"use client"`) : monté par `app/[locale]/page.tsx`, qui est
 * serveur, il fait partie du graphe client et lit sa locale dans
 * `NextIntlClientProvider` — la route reste donc statique.
 */
export function ErrorBoundary({
	children,
	fallback,
	renderFallback,
}: Readonly<Props>) {
	const t = useTranslations("errorBoundary");
	return (
		<Catch
			fallback={fallback}
			renderFallback={
				renderFallback ??
				((error, retry) => (
					<div className="p-6 bg-destructive/10 border border-destructive/30 rounded-xl">
						<h2 className="text-lg font-semibold text-destructive mb-2">
							{t("title")}
						</h2>
						<p className="text-sm text-destructive/90">
							{error?.message ?? t("unknown")}
						</p>
						<button
							type="button"
							onClick={retry}
							className="mt-4 px-4 py-2 bg-destructive/15 text-destructive rounded-md hover:bg-destructive/25 transition-colors"
						>
							{t("retry")}
						</button>
					</div>
				))
			}
		>
			{children}
		</Catch>
	);
}
