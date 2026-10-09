export function debounce<A extends unknown[]>(
	fn: (...args: A) => void,
	ms: number,
): ((...args: A) => void) & { cancel(): void; flush(): void } {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let pending: A | undefined;
	const run = () => {
		timer = undefined;
		if (pending) {
			const args = pending;
			pending = undefined;
			fn(...args);
		}
	};
	const debounced = (...args: A) => {
		pending = args;
		if (timer) clearTimeout(timer);
		timer = setTimeout(run, ms);
	};
	debounced.cancel = () => {
		if (timer) clearTimeout(timer);
		timer = undefined;
		pending = undefined;
	};
	debounced.flush = () => {
		if (timer) clearTimeout(timer);
		run();
	};
	return debounced;
}
