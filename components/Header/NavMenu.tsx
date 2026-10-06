"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavMenuProps {
	highlightContact: boolean;
	contactBtnRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function NavMenu({
	highlightContact,
	contactBtnRef,
}: Readonly<NavMenuProps>) {
	const pathname = usePathname();

	const isAboutPage = pathname === "/About";
	const isContactPage = pathname === "/Contact";
	const isHomePage = pathname === "/";
	const isArticlesPage = pathname?.startsWith("/articles") ?? false;

	return (
		<nav>
			<ul className="flex flex-wrap items-center justify-center gap-1 rounded-2xl bg-secondary/60 px-1.5 py-1 sm:flex-nowrap sm:rounded-full sm:px-2 ring-1 ring-border/70 backdrop-blur sm:gap-3">
				<li>
					<Button
						asChild
						variant="ghost"
						size="sm"
						className={cn(
							"rounded-full px-2.5 text-sm font-medium sm:px-3 transition-all duration-300",
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
							"rounded-full px-2.5 text-sm font-medium sm:px-3 transition-all duration-300",
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
						asChild
						variant="ghost"
						size="sm"
						className={cn(
							"rounded-full px-2.5 text-sm font-medium sm:px-3 transition-all duration-300",
							isArticlesPage
								? "bg-primary text-primary-foreground hover:bg-primary/90"
								: "hover:bg-primary/10 hover:text-primary",
						)}
					>
						<Link href="/articles">Articles</Link>
					</Button>
				</li>
				<li>
					<Button
						ref={contactBtnRef}
						asChild
						variant="ghost"
						size="sm"
						className={cn(
							"rounded-full px-2.5 text-sm font-medium sm:px-3 transition-all duration-500",
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
