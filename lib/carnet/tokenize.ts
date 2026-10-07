/**
 * Tokenizer par mot du carnet. Doit rester strictement identique à
 * scripts/distill/carnet_text.py (test de parité : lib/carnet/static-model.test.ts).
 */
const COMBINING_MARKS = /\p{M}/gu;
const WORD = /[a-z0-9]+/g;

export function foldText(text: string): string {
	return text.normalize("NFKD").replace(COMBINING_MARKS, "").toLowerCase();
}

export function tokenize(text: string): string[] {
	return (foldText(text).match(WORD) ?? []).filter((word) => word.length >= 2);
}
