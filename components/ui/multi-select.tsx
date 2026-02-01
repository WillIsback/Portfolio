"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type Option = {
	value: string;
	label: string;
};

interface MultiSelectProps {
	options: Option[];
	selected: string[];
	onChange: (selected: string[]) => void;
	placeholder?: string;
	emptyMessage?: string;
	className?: string;
}

export function MultiSelect({
	options,
	selected,
	onChange,
	placeholder = "Sélectionner...",
	emptyMessage = "Aucun résultat.",
	className,
}: MultiSelectProps) {
	const [open, setOpen] = React.useState(false);

	const handleSelect = (value: string) => {
		if (selected.includes(value)) {
			onChange(selected.filter((item) => item !== value));
		} else {
			onChange([...selected, value]);
		}
	};

	const selectedLabels = selected.map(
		(value) => options.find((opt) => opt.value === value)?.label ?? value,
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn("min-w-50 justify-between", className)}
				>
					<div className="flex flex-wrap gap-1 max-w-45">
						{selected.length === 0 ? (
							<span className="text-muted-foreground">{placeholder}</span>
						) : selected.length === 1 ? (
							<Badge variant="secondary">{selectedLabels[0]}</Badge>
						) : (
							<Badge variant="secondary">{selected.length} sélectionnés</Badge>
						)}
					</div>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-50 p-0">
				<Command>
					<CommandInput placeholder="Rechercher..." />
					<CommandList>
						<CommandEmpty>{emptyMessage}</CommandEmpty>
						<CommandGroup>
							{options.map((option) => (
								<CommandItem
									key={option.value}
									value={option.value}
									onSelect={() => handleSelect(option.value)}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											selected.includes(option.value)
												? "opacity-100"
												: "opacity-0",
										)}
									/>
									{option.label}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
