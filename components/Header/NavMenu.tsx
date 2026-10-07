"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavMenuProps {
	highlightContact: boolean;
	contactBtnRef?: React.RefObject<HTMLButtonElement | null>;
}

const LINKS = [
	{ href: "/", label: "Carnet", isActive: (p: string) => p === "/" },
	{
		href: "/articles",
		label: "Articles",
		isActive: (p: string) => p.startsWith("/articles"),
	},
	{
		href: "/About",
		label: "À propos",
		isActive: (p: string) => p === "/About",
	},
	{
		href: "/Contact",
		label: "Contact",
		isActive: (p: string) => p === "/Contact",
	},
];

export default function NavMenu({
	highlightContact,
	contactBtnRef,
}: Readonly<NavMenuProps>) {
	const pathname = usePathname() ?? "/";
	return (
		<nav aria-label="Navigation principale">
			<ul className="flex flex-wrap items-center gap-0.5 sm:gap-1">
				{LINKS.map((link) => {
					const active = link.isActive(pathname);
					const isContact = link.href === "/Contact";
					return (
						<li key={link.href}>
							<Button
								ref={isContact ? contactBtnRef : undefined}
								asChild
								variant="ghost"
								size="sm"
								className={cn(
									"rounded-none border-b-2 border-transparent px-2 font-display text-sm font-semibold transition-colors sm:px-3",
									active
										? "border-primary text-foreground"
										: "text-ink-soft hover:border-paper-grid hover:text-foreground",
									isContact &&
										highlightContact &&
										"border-primary text-primary",
								)}
							>
								<Link
									href={link.href}
									aria-current={active ? "page" : undefined}
								>
									{link.label}
								</Link>
							</Button>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
