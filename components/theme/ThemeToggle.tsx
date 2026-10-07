"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ThemeToggle({
	className,
}: Readonly<{ className?: string }>) {
	const { resolvedTheme, setTheme } = useTheme();

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
			aria-label="Basculer entre le thème clair et le thème sombre"
			title="Changer de thème"
			className={cn(
				"size-9 shrink-0 rounded-full bg-secondary/60 ring-1 ring-border/70 backdrop-blur hover:bg-primary/10 hover:text-primary",
				className,
			)}
		>
			{/* Les deux icônes sont rendues ; le CSS choisit (pas de mismatch d'hydratation). */}
			<Sun className="hidden size-4 dark:block" aria-hidden="true" />
			<Moon className="size-4 dark:hidden" aria-hidden="true" />
		</Button>
	);
}
