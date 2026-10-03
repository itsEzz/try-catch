/**
 * Represents a successful operation result
 * @template T The type of the successful data
 */
export type Success<T> = {
	data: T;
	error?: never;
	readonly ok: true;
};

/**
 * Represents a failed operation result
 * @template E The type of the error
 */
export type Failure<E> = {
	data?: never;
	error: E;
	readonly ok: false;
};

/**
 * Union type representing either a successful or failed operation result
 * @template T The type of the successful data
 * @template E The type of the error, defaults to Error
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Represents a value that might be a Promise or a direct value
 * @template T The type of the value
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Type guard to check if a result represents a successful operation
 *
 * @template T The type of the successful data
 * @template E The type of the error
 * @param result The result to check
 * @returns True if the result represents a successful operation
 */
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> => {
	return result.ok === true;
};

/**
 * Type guard to check if a result represents a failed operation
 *
 * @template T The type of the successful data
 * @template E The type of the error
 * @param result The result to check
 * @returns True if the result represents a failed operation
 */
export const isError = <T, E>(result: Result<T, E>): result is Failure<E> => {
	return result.ok === false;
};

/**
 * Creates a success result with the given data
 *
 * @template T The type of the successful data
 * @param data The data to include in the success result
 * @returns A Success object containing the data
 */
export const success = <T>(data: T): Success<T> => {
	return { data, ok: true };
};

/**
 * Creates a failure result with the given error
 *
 * @template E The type of the error
 * @param error The error to include in the failure result
 * @returns A Failure object containing the error
 */
export const failure = <E>(error: E): Failure<E> => {
	return { error, ok: false };
};

/**
 * Checks if a value is a Promise-like object (thenable).
 * Uses duck-typing so cross-realm promises and custom thenables are detected.
 *
 * @param value The value to check
 * @returns True if the value looks like a Promise
 */
const isPromiseLike = (value: unknown): value is PromiseLike<unknown> => {
	return (
		value !== null &&
		(typeof value === 'object' || typeof value === 'function') &&
		typeof (value as { then?: unknown }).then === 'function'
	);
};

/**
 * Transforms the data of a successful result using the provided function
 * If the result is a failure, returns the failure unchanged
 *
 * @template T The type of the original successful data
 * @template U The type of the transformed data
 * @template E The type of the error
 * @param result The result to transform
 * @param fn The transformation function
 * @returns A new Result with transformed data or the original failure
 */
export const map = <T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> => {
	return isSuccess(result) ? success(fn(result.data)) : result;
};

/**
 * Transforms the data of a successful result using a function that returns a Result
 * If the result is a failure, returns the failure unchanged
 *
 * @template T The type of the original successful data
 * @template U The type of the transformed data
 * @template E The type of the error
 * @param result The result to transform
 * @param fn The transformation function that returns a Result
 * @returns A new Result with transformed data or a failure
 */
export const flatMap = <T, U, E>(result: Result<T, E>, fn: (data: T) => Result<U, E>): Result<U, E> => {
	return isSuccess(result) ? fn(result.data) : result;
};

/**
 * Transforms the error of a failed result using the provided function
 * If the result is a success, returns the success unchanged
 *
 * @template T The type of the successful data
 * @template E The type of the original error
 * @template F The type of the transformed error
 * @param result The result to transform
 * @param fn The transformation function
 * @returns A new Result with transformed error or the original success
 */
export const mapError = <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
	return isError(result) ? failure(fn(result.error)) : result;
};

/**
 * Runs a side effect without changing the result.
 * Useful for logging, metrics, or debugging inside a pipeline.
 * The callback's return value is ignored and thrown errors are swallowed.
 * Async callbacks are fire-and-forget: their rejections are swallowed but not awaited.
 * Use {@link tapAsync} to await async side effects.
 *
 * @template T The type of the successful data
 * @template E The type of the error
 * @param result The result to tap into
 * @param fn The side-effect function receiving the full result
 * @returns The original result unchanged
 */
export function tap<T, E>(result: Result<T, E>, fn: (result: Result<T, E>) => unknown): Result<T, E>;
/**
 * Runs a side effect for one branch without changing the result.
 * Only the matching handler runs; its return value is ignored and thrown errors are swallowed.
 * Async handlers are fire-and-forget: their rejections are swallowed but not awaited.
 * Use {@link tapAsync} to await async side effects.
 *
 * @template T The type of the successful data
 * @template E The type of the error
 * @param result The result to tap into
 * @param handlers Object containing optional success and failure handlers
 * @returns The original result unchanged
 */
export function tap<T, E>(
	result: Result<T, E>,
	handlers: { success?: (data: T) => unknown; failure?: (error: E) => unknown },
): Result<T, E>;
export function tap<T, E>(
	result: Result<T, E>,
	fnOrHandlers:
		| ((result: Result<T, E>) => unknown)
		| { success?: (data: T) => unknown; failure?: (error: E) => unknown },
): Result<T, E> {
	try {
		const returned =
			typeof fnOrHandlers === 'function'
				? fnOrHandlers(result)
				: isSuccess(result)
					? fnOrHandlers.success?.(result.data)
					: fnOrHandlers.failure?.(result.error);
		if (isPromiseLike(returned)) {
			// Fire-and-forget: avoid unhandled rejections without changing sync behavior.
			Promise.resolve(returned).then(undefined, () => undefined);
		}
	} catch {
		// Intentionally swallow side-effect errors so tap never changes control flow.
	}
	return result;
}

/**
 * Runs an async side effect and awaits it without changing the result.
 * Useful for async logging, metrics, or debugging inside a pipeline.
 * The callback's return value is ignored; sync throws and async rejections are swallowed.
 *
 * @template T The type of the successful data
 * @template E The type of the error
 * @param result The result to tap into
 * @param fn The side-effect function receiving the full result
 * @returns A promise resolving to the original result unchanged
 */
export function tapAsync<T, E>(
	result: Result<T, E>,
	fn: (result: Result<T, E>) => unknown,
): Promise<Result<T, E>>;
/**
 * Runs an async side effect for one branch and awaits it without changing the result.
 * Only the matching handler runs; its return value is ignored and errors are swallowed.
 *
 * @template T The type of the successful data
 * @template E The type of the error
 * @param result The result to tap into
 * @param handlers Object containing optional success and failure handlers
 * @returns A promise resolving to the original result unchanged
 */
export function tapAsync<T, E>(
	result: Result<T, E>,
	handlers: { success?: (data: T) => unknown; failure?: (error: E) => unknown },
): Promise<Result<T, E>>;
export async function tapAsync<T, E>(
	result: Result<T, E>,
	fnOrHandlers:
		| ((result: Result<T, E>) => unknown)
		| { success?: (data: T) => unknown; failure?: (error: E) => unknown },
): Promise<Result<T, E>> {
	try {
		if (typeof fnOrHandlers === 'function') {
			await fnOrHandlers(result);
		} else if (isSuccess(result)) {
			await fnOrHandlers.success?.(result.data);
		} else {
			await fnOrHandlers.failure?.(result.error);
		}
	} catch {
		// Intentionally swallow side-effect errors so tapAsync never changes control flow.
	}
	return result;
}

/**
 * Combines multiple results into a single result.
 * If all results are successful, returns a success result containing an array of all data.
 * If any result is a failure, returns the first failure encountered.
 *
 * @template T The type of the successful data
 * @template E The type of the error
 * @param results Array of results to combine
 * @returns A Result containing an array of data or the first failure
 */
export const all = <T, E>(results: Result<T, E>[]): Result<T[], E> => {
	const data: T[] = [];
	for (const result of results) {
		if (isError(result)) return result;
		data.push(result.data);
	}
	return success(data);
};

/**
 * Extracts the data from a successful result or returns a default value
 *
 * @template T The type of the successful data
 * @template E The type of the error
 * @param result The result to unwrap
 * @param defaultValue The default value to return if the result is a failure
 * @returns The data if successful, otherwise the default value
 */
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
	return isSuccess(result) ? result.data : defaultValue;
};

/**
 * Extracts the data from a successful result or computes a default value using the error
 *
 * @template T The type of the successful data
 * @template E The type of the error
 * @param result The result to unwrap
 * @param fn Function that takes the error and returns a default value
 * @returns The data if successful, otherwise the computed default value
 */
export const unwrapOrElse = <T, E>(result: Result<T, E>, fn: (error: E) => T): T => {
	return isSuccess(result) ? result.data : fn(result.error);
};

/**
 * Pattern matching for Result types - handles both success and failure cases
 *
 * @template T The type of the successful data
 * @template E The type of the error
 * @template U The return type of both match functions
 * @param result The result to match against
 * @param handlers Object containing success and failure handler functions
 * @returns The result of calling the appropriate handler function
 */
export const match = <T, E, U>(
	result: Result<T, E>,
	handlers: {
		success: (data: T) => U;
		failure: (error: E) => U;
	},
): U => {
	return isSuccess(result) ? handlers.success(result.data) : handlers.failure(result.error);
};

/**
 * Safely executes a function or awaits a promise, capturing any errors
 *
 * This utility provides a consistent way to handle both synchronous and asynchronous
 * operations that might throw errors. It returns a Result object that can be checked
 * with isSuccess, isError, or the ok property.
 *
 * @template T The type of the successful result
 * @template E The type of the error, defaults to unknown
 * @param fnOrPromise The function to execute, promise to await, or async function to call
 * @returns A Result object for synchronous functions or Promise<Result> for promises and async functions, containing either data or error
 */
export function tryCatch<T, E = unknown>(fn: () => Promise<T>): Promise<Result<T, E>>;
export function tryCatch<T, E = unknown>(fn: () => T): Result<T, E>;
export function tryCatch<T, E = unknown>(promise: Promise<T>): Promise<Result<T, E>>;
export function tryCatch<T, E = unknown>(
	fnOrPromise: Promise<T> | (() => MaybePromise<T>),
): Result<T, E> | Promise<Result<T, E>> {
	if (typeof fnOrPromise === 'function') {
		try {
			const result = fnOrPromise();

			if (isPromiseLike(result)) {
				return Promise.resolve(result).then(
					(data) => success(data as T),
					(error) => failure(error as E),
				);
			}

			return success(result as T);
		} catch (error) {
			return failure(error as E);
		}
	}

	return Promise.resolve(fnOrPromise).then(
		(data) => success(data),
		(error) => failure(error as E),
	);
}

/**
 * Safely executes a synchronous function, capturing any errors
 *
 * This utility is specifically for synchronous operations that might throw errors.
 * It guarantees a synchronous Result return type, never a Promise.
 *
 * @template T The type of the successful result
 * @template E The type of the error, defaults to unknown
 * @param fn The synchronous function to execute
 * @returns A Result object containing either data or error
 */
export function tryCatchSync<T, E = unknown>(
	fn: () => Exclude<T, PromiseLike<unknown>>,
): Result<Exclude<T, PromiseLike<unknown>>, E> {
	try {
		const result = fn();
		if (isPromiseLike(result)) {
			return failure(
				new TypeError(
					'tryCatchSync received a Promise. Use tryCatch or tryCatchAsync for async functions.',
				) as E,
			);
		}
		return success(result);
	} catch (error) {
		return failure(error as E);
	}
}

/**
 * Safely executes an asynchronous function or awaits a promise, capturing any errors
 *
 * This utility is specifically for asynchronous operations that might throw errors.
 * It guarantees a Promise<Result> return type.
 *
 * @template T The type of the successful result
 * @template E The type of the error, defaults to unknown
 * @param fnOrPromise The async function to execute or promise to await
 * @returns A Promise<Result> containing either data or error
 */
export async function tryCatchAsync<T, E = unknown>(fn: () => Promise<T>): Promise<Result<T, E>>;
export async function tryCatchAsync<T, E = unknown>(promise: Promise<T>): Promise<Result<T, E>>;
export async function tryCatchAsync<T, E = unknown>(
	fnOrPromise: Promise<T> | (() => Promise<T>),
): Promise<Result<T, E>> {
	try {
		const data = typeof fnOrPromise === 'function' ? await fnOrPromise() : await fnOrPromise;
		return success(data);
	} catch (error) {
		return failure(error as E);
	}
}

/**
 * Short alias for tryCatch - safely executes a function or awaits a promise
 *
 * @template T The type of the successful result
 * @template E The type of the error, defaults to unknown
 * @param fnOrPromise The function to execute, promise to await, or async function to call
 * @returns A Result object for synchronous functions or Promise<Result> for promises and async functions, containing either data or error
 */
export const t = tryCatch;

/**
 * Short alias for tryCatchSync - safely executes a synchronous function
 *
 * @template T The type of the successful result
 * @template E The type of the error, defaults to unknown
 * @param fn The synchronous function to execute
 * @returns A Result object containing either data or error
 */
export const tc = tryCatchSync;

/**
 * Short alias for tryCatchAsync - safely executes an async function or awaits a promise
 *
 * @template T The type of the successful result
 * @template E The type of the error, defaults to unknown
 * @param fnOrPromise The async function to execute or promise to await
 * @returns A Promise<Result> containing either data or error
 */
export const tca = tryCatchAsync;
