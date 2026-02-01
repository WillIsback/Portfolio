"use client";

import { Component, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
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
			return (
				this.props.fallback ?? (
					<div className="p-6 bg-red-50 border border-red-200 rounded-xl">
						<h2 className="text-lg font-semibold text-red-800 mb-2">
							Une erreur est survenue
						</h2>
						<p className="text-sm text-red-600">
							{this.state.error?.message ?? "Erreur inconnue"}
						</p>
						<button
							type="button"
							onClick={() =>
								this.setState({ hasError: false, error: undefined })
							}
							className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
						>
							Réessayer
						</button>
					</div>
				)
			);
		}

		return this.props.children;
	}
}
