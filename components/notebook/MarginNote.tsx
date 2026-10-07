"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { NOTE_DELAY_SECONDS } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface MarginNoteProps {
	children: ReactNode;
	side?: "left" | "right";
}

/**
 * Annotation manuscrite. Dans le flux du texte sur mobile ; dans la marge à partir de `xl`
 * (le parent doit être `relative`).
 */
export default function MarginNote({
	children,
	side = "right",
}: Readonly<MarginNoteProps>) {
	const reduced = useReducedMotion();
	return (
		<motion.aside
			className={cn(
				"font-hand text-lg leading-snug text-note my-3 xl:my-0 xl:absolute xl:top-0 xl:w-48",
				side === "right" ? "xl:-right-56" : "xl:-left-56 xl:text-right",
			)}
			initial={reduced ? false : { opacity: 0, y: 4 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.4, delay: NOTE_DELAY_SECONDS }}
		>
			{children}
		</motion.aside>
	);
}
