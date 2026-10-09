import type { Scored } from "./search";

export type WorkerRequest =
	| { type: "init" }
	| { type: "query"; seq: number; text: string };

export type WorkerResponse =
	| { type: "ready" }
	| { type: "error"; message: string }
	| { type: "result"; seq: number; ranked: Scored[] | null };
