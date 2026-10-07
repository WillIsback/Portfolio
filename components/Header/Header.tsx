import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";
import NavMenu from "./NavMenu";

interface HeaderProps {
	highlightContact: boolean;
	contactBtnRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function Header({
	highlightContact = false,
	contactBtnRef,
}: Readonly<HeaderProps>) {
	return (
		<header className="w-full border-b border-border/70 bg-background/85 backdrop-blur">
			<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
				<Link
					href="/"
					className="flex items-baseline gap-3 transition-opacity hover:opacity-80"
				>
					<span className="font-display text-lg font-semibold tracking-tight text-foreground">
						William Derue
					</span>
					<span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft">
						Carnet de labo
					</span>
				</Link>
				<div className="flex items-center gap-1 sm:gap-2">
					<NavMenu
						highlightContact={highlightContact}
						contactBtnRef={contactBtnRef}
					/>
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
