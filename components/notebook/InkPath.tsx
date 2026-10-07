"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE_INK, INK_DRAW_SECONDS } from "@/lib/motion";

interface InkPathProps {
	d: string;
	className?: string;
	strokeWidth?: number;
	delay?: number;
}

/**
 * Trait d'encre qui se dessine une seule fois à sa première apparition.
 * Le rendu serveur et le mouvement réduit sont l'état final ; l'animation ne part
 * que côté client quand `useReducedMotion()` vaut strictement `false`.
 */
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
			whileInView={reduced === false ? { pathLength: [0, 1] } : undefined}
			viewport={{ once: true }}
			transition={{ duration: INK_DRAW_SECONDS, ease: EASE_INK, delay }}
		/>
	);
}
