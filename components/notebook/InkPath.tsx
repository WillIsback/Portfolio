"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE_INK, INK_DRAW_SECONDS } from "@/lib/motion";

interface InkPathProps {
	d: string;
	className?: string;
	strokeWidth?: number;
	delay?: number;
}

/** Trait d'encre qui se dessine une seule fois à sa première apparition. */
export default function InkPath({
	d,
	className,
	strokeWidth = 1.6,
	delay = 0,
}: Readonly<InkPathProps>) {
	const reduced = useReducedMotion();
	return (
		<motion.path
			d={d}
			className={className}
			fill="none"
			stroke="currentColor"
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
			initial={reduced ? false : { pathLength: 0 }}
			whileInView={{ pathLength: 1 }}
			viewport={{ once: true, margin: "-10% 0px" }}
			transition={{ duration: INK_DRAW_SECONDS, ease: EASE_INK, delay }}
		/>
	);
}
