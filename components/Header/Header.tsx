import Link from "next/link";
import avatarSrc from "@/app/assets/coin_profile_pic.png";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
		<header className="w-full rounded-2xl border border-border/60 bg-linear-to-r from-card/90 via-card to-muted/70 py-4 shadow-[0_12px_60px_-25px_var(--primary)] backdrop-blur px-3 sm:px-8 xl:px-32">
			<div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:flex-nowrap lg:justify-between">
				<Link
					href="/"
					className="flex items-center gap-3 hover:opacity-90 transition-opacity"
				>
					<Avatar className="size-12 ring-2 ring-background/70 shadow-lg shadow-primary/25">
						<AvatarImage src={avatarSrc.src} alt="Portrait de William Derue" />
						<AvatarFallback>WD</AvatarFallback>
					</Avatar>
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<h1 className="text-xl font-semibold tracking-tight text-foreground">
								William Derue
							</h1>
							<span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground">
								IA/ML
							</span>
						</div>
						<p className="hidden text-sm text-muted-foreground lg:block">
							Full-stack · Solutions IA génératives et ML
						</p>
					</div>
				</Link>

				<div className="flex items-center gap-2 sm:gap-3">
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
