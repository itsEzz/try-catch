/*!
 * Represents a successful operation result
 * @template T The type of the successful data
 */
export type Success<T> = {
	data: T;
	error?: never;
};

/*!
 * Represents a failed operation result
 * @template E The type of the error
 */
export type Failure<E> = {
	data?: never;
	error: E;
};

/*!
 * Union type representing either a successful or failed operation result
 * @template T The type of the successful data
 * @template E The type of the error, defaults to Error
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/*!
 * Represents a value that might be a Promise or a direct value
 * @template T The type of the value
 */
export type MaybePromise<T> = T | Promise<T>;

/*!
 * Type guard to check if a result represents a successful operation
 *
 * @template T The type of the successful data
 * @template E The type of the error
 * @param result The result to check
 * @returns True if the result represents a successful operation
 */
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> => {
	return 'data' in result;
};

/*!
 * Type guard to check if a result represents a failed operation
 *
 * @template T The type of the successful data
 * @template E The type of the error
 * @param result The result to check
 * @returns True if the result represents a failed operation
 */
export const isError = <T, E>(result: Result<T, E>): result is Failure<E> => {
	return 'error' in result;
};

/*!
 * Creates a success result with the given data
 *
 * @template T The type of the successful data
 * @param data The data to include in the success result
 * @returns A Success object containing the data
 */
export const success = <T>(data: T): Success<T> => {
	return { data };
};

/*!
 * Creates a failure result with the given error
 *
 * @template E The type of the error
 * @param error The error to include in the failure result
 * @returns A Failure object containing the error
 */
export const failure = <E>(error: E): Failure<E> => {
	return { error };
};

/*!
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

/*!
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

/*!
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

/*!
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

/*!
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
	}
): U => {
	return isSuccess(result) ? handlers.success(result.data) : handlers.failure(result.error);
};

/*!
 * Safely executes a function or awaits a promise, capturing any errors
 *
 * This utility provides a consistent way to handle both synchronous and asynchronous
 * operations that might throw errors. It returns a Result object that can be checked
 * with isSuccess or isError.
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
	fnOrPromise: Promise<T> | (() => MaybePromise<T>)
): Result<T, E> | Promise<Result<T, E>> {
	if (typeof fnOrPromise === 'function') {
		try {
			const result = fnOrPromise();

			if (result instanceof Promise) {
				return result.then((data) => success(data)).catch((error) => failure(error as E));
			}

			return success(result);
		} catch (error) {
			return failure(error as E);
		}
	}

	return fnOrPromise.then((data) => success(data)).catch((error) => failure(error as E));
}

/*!
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
export function tryCatchSync<T, E = unknown>(fn: () => T): Result<T, E> {
	try {
		const result = fn();
		return success(result);
	} catch (error) {
		return failure(error as E);
	}
}

/*!
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
	fnOrPromise: Promise<T> | (() => Promise<T>)
): Promise<Result<T, E>> {
	try {
		const data = typeof fnOrPromise === 'function' ? await fnOrPromise() : await fnOrPromise;
		return success(data);
	} catch (error) {
		return failure(error as E);
	}
}

/*!
 * Short alias for tryCatch - safely executes a function or awaits a promise
 *
 * @template T The type of the successful result
 * @template E The type of the error, defaults to unknown
 * @param fnOrPromise The function to execute, promise to await, or async function to call
 * @returns A Result object for synchronous functions or Promise<Result> for promises and async functions, containing either data or error
 */
export const t = tryCatch;

/*!
 * Short alias for tryCatchSync - safely executes a synchronous function
 *
 * @template T The type of the successful result
 * @template E The type of the error, defaults to unknown
 * @param fn The synchronous function to execute
 * @returns A Result object containing either data or error
 */
export const tc = tryCatchSync;

/*!
 * Short alias for tryCatchAsync - safely executes an async function or awaits a promise
 *
 * @template T The type of the successful result
 * @template E The type of the error, defaults to unknown
 * @param fnOrPromise The async function to execute or promise to await
 * @returns A Promise<Result> containing either data or error
 */
export const tca = tryCatchAsync;
