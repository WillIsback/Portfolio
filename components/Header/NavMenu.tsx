"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavMenuProps {
	highlightContact: boolean;
	contactBtnRef: React.RefObject<HTMLButtonElement | null>;
}

export default function NavMenu({
	highlightContact,
	contactBtnRef,
}: Readonly<NavMenuProps>) {
	const pathname = usePathname();

	const isAboutPage = pathname === "/About";
	const isContactPage = pathname === "/Contact";
	const isHomePage = pathname === "/";

	return (
		<nav>
			<ul className="flex items-center gap-2 rounded-full bg-secondary/60 px-2 py-1 ring-1 ring-border/70 backdrop-blur sm:gap-3">
				<li>
					<Button
						asChild
						variant="ghost"
						size="sm"
						className={cn(
							"rounded-full px-3 text-sm font-medium transition-all duration-300",
							isAboutPage
								? "bg-primary text-primary-foreground hover:bg-primary/90"
								: "hover:bg-primary/10 hover:text-primary",
						)}
					>
						<Link href="/About">À propos</Link>
					</Button>
				</li>
				<li>
					<Button
						asChild
						variant="ghost"
						size="sm"
						className={cn(
							"rounded-full px-3 text-sm font-medium transition-all duration-300",
							isHomePage
								? "hover:bg-primary/10 hover:text-primary"
								: "hover:bg-primary/10 hover:text-primary opacity-70",
						)}
					>
						<Link href="/#realisations">Réalisations</Link>
					</Button>
				</li>
				<li>
					<Button
						ref={contactBtnRef}
						asChild
						variant="ghost"
						size="sm"
						className={cn(
							"rounded-full px-3 text-sm font-medium transition-all duration-500",
							isContactPage
								? "bg-primary text-primary-foreground hover:bg-primary/90"
								: "hover:bg-primary/10 hover:text-primary",
							highlightContact &&
								"bg-primary text-primary-foreground shadow-[0_0_30px_var(--primary)] scale-110 ring-2 ring-primary",
						)}
					>
						<Link href="/Contact">Contact</Link>
					</Button>
				</li>
			</ul>
		</nav>
	);
}
