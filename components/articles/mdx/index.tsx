import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { FaultBuckets } from "./FaultBuckets";
import { KeyFigures } from "./KeyFigures";
import { Lesson } from "./Lesson";
import { Sources } from "./Sources";
import { TasksChart } from "./TasksChart";
import { Timeline } from "./Timeline";
import { TokensChart } from "./TokensChart";
import { Verdicts } from "./Verdicts";

function textOf(node: ReactNode): string {
	if (typeof node === "string" || typeof node === "number") return `${node}`;
	if (Array.isArray(node)) return node.map(textOf).join("");
	if (node && typeof node === "object" && "props" in node) {
		return textOf((node.props as { children?: ReactNode }).children);
	}
	return "";
}

export function headingId(children: ReactNode): string {
	return textOf(children)
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function H2({ children, ...props }: ComponentPropsWithoutRef<"h2">) {
	return (
		<h2 id={headingId(children)} {...props}>
			{children}
		</h2>
	);
}

function H3({ children, ...props }: ComponentPropsWithoutRef<"h3">) {
	return (
		<h3 id={headingId(children)} {...props}>
			{children}
		</h3>
	);
}

function A({ href = "", children, ...props }: ComponentPropsWithoutRef<"a">) {
	if (href.startsWith("/") || href.startsWith("#")) {
		return (
			<Link href={href} {...props}>
				{children}
			</Link>
		);
	}
	return (
		<a href={href} target="_blank" rel="noopener noreferrer" {...props}>
			{children}
		</a>
	);
}

function Table(props: ComponentPropsWithoutRef<"table">) {
	return (
		// biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable region must be keyboard-reachable
		<div className="table-scroll" tabIndex={0}>
			<table {...props} />
		</div>
	);
}

function Pre(props: ComponentPropsWithoutRef<"pre">) {
	// biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable region must be keyboard-reachable
	return <pre tabIndex={0} {...props} />;
}

export const mdxComponents = {
	h2: H2,
	h3: H3,
	a: A,
	table: Table,
	pre: Pre,
	KeyFigures,
	Timeline,
	TasksChart,
	TokensChart,
	FaultBuckets,
	Verdicts,
	Lesson,
	Sources,
};
