"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ThemeToggle({
	className,
}: Readonly<{ className?: string }>) {
	const { resolvedTheme, setTheme } = useTheme();
	const t = useTranslations("theme");

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
			aria-label={t("toggle")}
			title={t("toggleTitle")}
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
