import Link from "next/link";
import avatarSrc from "@/app/assets/coin_profile_pic.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NavMenu from "./NavMenu";

interface HeaderProps {
	highlightContact: boolean;
	contactBtnRef: React.RefObject<HTMLButtonElement | null>;
}

export default function Header({
	highlightContact = false,
	contactBtnRef,
}: Readonly<HeaderProps>) {
	return (
		<header className="w-full rounded-2xl border border-border/60 bg-linear-to-r from-white/90 via-white to-slate-50/70 py-4 shadow-[0_12px_60px_-25px_rgba(59,130,246,0.45)] backdrop-blur dark:from-black/80 dark:via-slate-950 dark:to-black/60 px-32">
			<div className="flex items-center justify-between gap-6">
				<Link
					href="/"
					className="flex items-center gap-3 hover:opacity-90 transition-opacity"
				>
					<Avatar className="size-12 ring-2 ring-white/70 shadow-lg shadow-sky-500/25 dark:ring-black/60">
						<AvatarImage src={avatarSrc.src} alt="Portrait de William Derue" />
						<AvatarFallback>WD</AvatarFallback>
					</Avatar>
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<h1 className="text-xl font-semibold tracking-tight">
								William Derue
							</h1>
							<span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground">
								IA/ML
							</span>
						</div>
						<p className="text-sm text-muted-foreground">
							Full-stack · Solutions IA génératives et ML
						</p>
					</div>
				</Link>

				<NavMenu
					highlightContact={highlightContact}
					contactBtnRef={contactBtnRef}
				/>
			</div>
		</header>
	);
}
