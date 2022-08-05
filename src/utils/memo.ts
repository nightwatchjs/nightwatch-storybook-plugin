export interface SingletonFunction<T extends readonly unknown[], R> {
	(...args: T): R;
	reset: () => void;
}

/**
 * Returns a function that remembers the result of the first call and returns it.
 * `reset` method deletes the result and encourage function to rerun.
 */
export default <T extends readonly unknown[], R>(
	fn: (...args: T) => R,
): SingletonFunction<T, R> => {
	let result: R | null = null;

	const singletonFunction = (...args: T): R => result ?? (result = fn(...args));

	Reflect.defineProperty(singletonFunction, "reset", {
		value: () => void (result = null),
		writable: false,
		enumerable: true,
		configurable: false,
	});

	return singletonFunction as SingletonFunction<T, R>;
};
