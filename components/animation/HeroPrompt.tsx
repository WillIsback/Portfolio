"use client";

import { motion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// On définit proprement les étapes possibles
type Stage = "typing" | "waiting" | "ready" | "sending" | "sent";

interface HeroPromptProps {
	onSendTrigger: () => void;
	sendBtnRef: React.RefObject<HTMLButtonElement | null>;
}

export default function HeroPrompt({
	onSendTrigger,
	sendBtnRef,
}: Readonly<HeroPromptProps>) {
	const [text, setText] = useState("");
	const fullText = "Bonjour, je veux exploiter ma data !";

	// Correction 2 : On ajoute "sending" et "sent" aux types autorisés
	const [stage, setStage] = useState<Stage>("typing");

	// Correction 1 : Gestion propre de l'effet de frappe pour éviter la boucle infinie
	useEffect(() => {
		if (stage === "typing") {
			if (text.length < fullText.length) {
				// Tant qu'il reste du texte, on continue d'écrire
				const timeout = setTimeout(() => {
					setText(fullText.slice(0, text.length + 1));
				}, 50);
				return () => clearTimeout(timeout);
			} else {
				// Une fois fini, on change d'état (cela ne causera pas de boucle car stage changera)
				const timeout = setTimeout(() => {
					setStage("waiting");
				}, 0);
				return () => clearTimeout(timeout);
			}
		}
	}, [text, stage]); // Dépendances correctes

	// 2. Pause avant d'activer le bouton (Waiting -> Ready)
	useEffect(() => {
		if (stage === "waiting") {
			const timeout = setTimeout(() => {
				setStage("ready");
			}, 800);
			return () => clearTimeout(timeout);
		}
	}, [stage]);

	// 3. Action de clic
	const handleClick = () => {
		if (stage === "ready") {
			setStage("sending"); // On passe visuellement en mode "envoi"
			onSendTrigger(); // On déclenche l'animation du parent (le trait SVG)

			// Optionnel : Reset après l'animation (3s) pour rejouer si besoin
			setTimeout(() => {
				setStage("sent");
			}, 1000);
		}
	};

	return (
		<div className="relative w-full max-w-xl mx-auto mt-10 p-4">
			<div className="relative flex items-center gap-2 rounded-xl border border-input bg-background/50 p-2 shadow-sm backdrop-blur ring-1 ring-primary/10">
				{/* Icône décorative à gauche */}
				<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<Sparkles className="h-4 w-4" />
				</span>

				{/* Zone de texte machine à écrire */}
				<div className="flex-1 text-sm font-medium text-foreground min-h-[20px] text-left">
					{text}
					{/* Curseur clignotant tant qu'on tape */}
					{(stage === "typing" || stage === "waiting") && (
						<motion.span
							animate={{ opacity: [0, 1, 0] }}
							transition={{ repeat: Infinity, duration: 0.8 }}
							className="inline-block h-4 w-0.5 translate-y-0.5 bg-primary ml-1"
						/>
					)}
				</div>

				{/* Bouton d'action */}
				<Button
					ref={sendBtnRef}
					size="icon"
					onClick={handleClick}
					disabled={stage !== "ready" && stage !== "sending"} // On désactive sauf si prêt ou en train d'envoyer
					className={`rounded-lg transition-all duration-300
            ${stage === "ready" ? "bg-primary text-primary-foreground hover:bg-primary/90 animate-pulse" : ""}
            ${stage === "sending" ? "bg-primary text-primary-foreground scale-90" : "ghost"}
          `}
				>
					<Send
						className={`h-4 w-4 transition-transform ${stage === "sending" ? "translate-x-1 -translate-y-1" : ""}`}
					/>
				</Button>
			</div>
		</div>
	);
}
