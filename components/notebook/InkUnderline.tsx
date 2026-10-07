import type { ReactNode } from "react";
import InkPath from "./InkPath";

/** Soulignement tracé à la main, à l'accent. */
export default function InkUnderline({
	children,
}: Readonly<{ children: ReactNode }>) {
	return (
		<span className="relative inline-block">
			{children}
			<svg
				aria-hidden="true"
				className="pointer-events-none absolute -bottom-1.5 left-0 h-2.5 w-full text-primary"
				viewBox="0 0 100 10"
				preserveAspectRatio="none"
			>
				<InkPath
					d="M2 6 C 22 2, 48 9, 70 5 S 92 4, 98 6"
					strokeWidth={2}
					vectorEffect="non-scaling-stroke"
				/>
			</svg>
		</span>
	);
}
