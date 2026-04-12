"use client";

import Image from "next/image";
import type React from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FILE_ICONS, LUCIDE_ICONS } from "@/lib/icon-bank";

interface IconPickerModalProps {
	open: boolean;
	current: string | undefined;
	onSelect: (value: string) => void;
	onClose: () => void;
}

export function IconPickerModal({
	open,
	current,
	onSelect,
	onClose,
}: IconPickerModalProps) {
	const logos = FILE_ICONS.filter((i) => i.category === "logo");
	const icons = FILE_ICONS.filter((i) => i.category === "icon");

	function handleSelect(value: string) {
		onSelect(value);
		onClose();
	}

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-zinc-950 border-zinc-800">
				<DialogHeader>
					<DialogTitle className="text-zinc-100">Choisir une icône</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					<Section title="Logos projet">
						<IconGrid>
							{logos.map((icon) => (
								<IconTile
									key={icon.path}
									label={icon.label}
									isSelected={current === icon.path}
									onClick={() => handleSelect(icon.path)}
								>
									<Image
										src={icon.path}
										alt={icon.label}
										width={40}
										height={40}
										className="object-contain w-10 h-10"
									/>
								</IconTile>
							))}
						</IconGrid>
					</Section>

					<Section title="Icônes tech">
						<IconGrid>
							{icons.map((icon) => (
								<IconTile
									key={icon.path}
									label={icon.label}
									isSelected={current === icon.path}
									onClick={() => handleSelect(icon.path)}
								>
									<Image
										src={icon.path}
										alt={icon.label}
										width={40}
										height={40}
										className="object-contain w-10 h-10"
									/>
								</IconTile>
							))}
						</IconGrid>
					</Section>

					<Section title="Génériques">
						<IconGrid>
							{LUCIDE_ICONS.map((icon) => {
								const IconComponent = icon.component;
								return (
									<IconTile
										key={icon.id}
										label={icon.label}
										isSelected={current === icon.id}
										onClick={() => handleSelect(icon.id)}
									>
										<IconComponent className="w-10 h-10 text-zinc-300" />
									</IconTile>
								);
							})}
						</IconGrid>
					</Section>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-2">
			<p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
				{title}
			</p>
			{children}
		</div>
	);
}

function IconGrid({ children }: { children: React.ReactNode }) {
	return <div className="flex flex-wrap gap-2">{children}</div>;
}

function IconTile({
	label,
	isSelected,
	onClick,
	children,
}: {
	label: string;
	isSelected: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			title={label}
			onClick={onClick}
			className={`flex flex-col items-center gap-1 p-2 rounded-lg border cursor-pointer transition-colors w-16 ${
				isSelected
					? "border-zinc-400 bg-zinc-800"
					: "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900"
			}`}
		>
			{children}
			<span className="text-[10px] text-zinc-500 truncate w-full text-center">
				{label}
			</span>
		</button>
	);
}
