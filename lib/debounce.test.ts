import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debounce } from "./debounce";

describe("debounce", () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it("n'appelle qu'une fois, avec les derniers arguments, après la pause", () => {
		const fn = vi.fn();
		const d = debounce(fn, 300);
		d("a");
		d("ag");
		vi.advanceTimersByTime(299);
		expect(fn).not.toHaveBeenCalled();
		d("age");
		vi.advanceTimersByTime(300);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith("age");
	});

	it("peut être annulé ou exécuté immédiatement", () => {
		const fn = vi.fn();
		const d = debounce(fn, 300);
		d("x");
		d.cancel();
		vi.advanceTimersByTime(300);
		expect(fn).not.toHaveBeenCalled();
		d("y");
		d.flush();
		expect(fn).toHaveBeenCalledWith("y");
		vi.advanceTimersByTime(300);
		expect(fn).toHaveBeenCalledTimes(1);
	});
});
