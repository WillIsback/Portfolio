// app/page.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import HeroPrompt from "@/components/animation/HeroPrompt";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header";
import ProjectGrid from "@/components/ProjectGrid/ProjectGrid";
import SkillsStack from "@/components/Skills/SkillsStack";
export default function Home() {
	const [highlightContact, setHighlightContact] = useState(false);
	const [showPath, setShowPath] = useState(false);
	const [svgPath, setSvgPath] = useState("");

	// 1. Nouvel état pour forcer le reset du composant HeroPrompt
	const [promptKey, setPromptKey] = useState(0);

	const contactBtnRef = useRef<HTMLButtonElement>(null);
	const sendBtnRef = useRef<HTMLButtonElement>(null);

	const calculatePath = () => {
		if (!contactBtnRef.current || !sendBtnRef.current) return;

		const startRect = sendBtnRef.current.getBoundingClientRect();
		const endRect = contactBtnRef.current.getBoundingClientRect();

		const startX = startRect.left + startRect.width / 2;
		const startY = startRect.top + startRect.height / 2;
		const endX = endRect.left + endRect.width / 2;
		const endY = endRect.top + endRect.height / 2;

		const controlPoint1X = startX + 50;
		const controlPoint1Y = startY - 150;
		const controlPoint2X = endX - 50;
		const controlPoint2Y = endY + 150;

		const path = `M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`;
		setSvgPath(path);
	};

	// On recalcule le chemin à chaque fois que le composant Hero est reset (car le bouton peut bouger légèrement)
	// biome-ignore lint/correctness/useExhaustiveDependencies: calculatePath uses refs that don't change
	useEffect(() => {
		// Petit délai pour laisser le temps au DOM de se placer
		setTimeout(calculatePath, 100);
		window.addEventListener("resize", calculatePath);
		return () => window.removeEventListener("resize", calculatePath);
	}, [promptKey]); // Dépendance ajoutée ici

	const handleStartAnimation = () => {
		calculatePath();
		setShowPath(true);
	};

	const resetAnimation = () => {
		setPromptKey((prev) => prev + 1);
	};

	const disableHighlightAndReset = () => {
		setHighlightContact(false);
		setTimeout(resetAnimation, 1000);
	};

	const handlePathComplete = () => {
		setShowPath(false);
		setHighlightContact(true);
		setTimeout(disableHighlightAndReset, 3000);
	};

	return (
		<main className="relative min-h-screen flex flex-col bg-background">
			<div className="sticky top-0 z-50 p-6 flex justify-center w-full">
				<Header
					highlightContact={highlightContact}
					contactBtnRef={contactBtnRef}
				/>
			</div>

			<div className="mt-20 flex flex-col items-center text-center space-y-6 px-4">
				<h2 className="text-4xl font-display font-bold tracking-tight text-foreground sm:text-6xl">
					De la Data à la{" "}
					<span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-orange-200">
						Décision.
					</span>
				</h2>
				<p className="max-w-2xl text-lg text-muted-foreground">
					Je conçois des architectures full-stack propulsées par
					l&apos;intelligence artificielle.
				</p>

				{/* 3. On passe la KEY ici */}
				{/* Chaque fois que promptKey change, ce composant est détruit et recréé à neuf */}
				<HeroPrompt
					key={promptKey}
					onSendTrigger={handleStartAnimation}
					sendBtnRef={sendBtnRef}
				/>
			</div>

			<AnimatePresence>
				{showPath && (
					<svg
						className="fixed inset-0 pointer-events-none z-100 w-full h-full overflow-visible"
						aria-label="Animation path from hero to contact"
					>
						<title>Animation path</title>
						<motion.path
							d={svgPath}
							fill="transparent"
							stroke="var(--primary)"
							strokeWidth="4"
							strokeLinecap="round"
							strokeDasharray="10 10"
							initial={{ pathLength: 0, opacity: 1 }}
							animate={{ pathLength: 1, opacity: 1 }}
							exit={{ opacity: 0, transition: { duration: 0.5 } }}
							transition={{ duration: 1.2, ease: "easeInOut" }}
							onAnimationComplete={handlePathComplete}
						/>

						<motion.circle
							r="6"
							fill="var(--background)"
							stroke="var(--primary)"
							strokeWidth="2"
						>
							<animateMotion
								dur="1.2s"
								repeatCount={1}
								path={svgPath}
								fill="freeze"
							/>
						</motion.circle>
					</svg>
				)}
			</AnimatePresence>
			<hr />
			<div className="flex flex-col py-10">
				<h3 className="m-auto text-center text-2xl font-bold">
					{" "}
					Mes skills à travers les stacks
				</h3>
				<SkillsStack />
			</div>
			<section id="realisations" className="px-30 h-fit">
				<ProjectGrid />
			</section>
			<Footer />
		</main>
	);
}
