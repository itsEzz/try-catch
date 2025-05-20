/**
 * @file Result type and utility functions for elegant error handling in TypeScript
 *
 * This module provides a Result type pattern for handling errors in a functional way,
 * along with utility functions to work with Results. The main function, tryCatch,
 * wraps operations that might throw errors and returns a Result object.
 */

/**
 * Represents a successful operation result
 * @template T The type of the successful data
 */
export type Success<T> = {
	data: T;
	error?: never;
};

/**
 * Represents a failed operation result
 * @template E The type of the error
 */
export type Failure<E> = {
	data?: never;
	error: E;
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
 *
 * @example
 * ```ts
 * const result = tryCatch(() => "success");
 * if (isSuccess(result)) {
 *   console.log(result.data); // "success"
 * }
 * ```
 */
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> => {
	return 'data' in result;
};

/**
 * Type guard to check if a result represents a failed operation
 *
 * @template T The type of the successful data
 * @template E The type of the error
 * @param result The result to check
 * @returns True if the result represents a failed operation
 *
 * @example
 * ```ts
 * const result = tryCatch(() => { throw new Error("failed") });
 * if (isError(result)) {
 *   console.error(result.error.message); // "failed"
 * }
 * ```
 */
export const isError = <T, E>(result: Result<T, E>): result is Failure<E> => {
	return 'error' in result;
};

/**
 * Creates a success result with the given data
 *
 * @template T The type of the successful data
 * @param data The data to include in the success result
 * @returns A Success object containing the data
 *
 * @example
 * ```ts
 * const result = success("data");
 * // { data: "data" }
 * ```
 */
export const success = <T>(data: T): Success<T> => {
	return { data };
};

/**
 * Creates a failure result with the given error
 *
 * @template E The type of the error
 * @param error The error to include in the failure result
 * @returns A Failure object containing the error
 *
 * @example
 * ```ts
 * const result = failure(new Error("Something went wrong"));
 * // { error: Error("Something went wrong") }
 * ```
 */
export const failure = <E>(error: E): Failure<E> => {
	return { error };
};

/**
 * Infer the return type of tryCatch based on the input type
 * If the input is a Promise<T>, the output is Promise<Result<T, E>>
 * If the input is a function returning Promise<T>, the output is Promise<Result<T, E>>
 * If the input is a function returning T, the output is Result<T, E>
 */
type TryCatchReturn<T, E, F> = F extends Promise<infer U>
	? Promise<Result<U, E>>
	: F extends () => Promise<infer U>
	? Promise<Result<U, E>>
	: F extends () => infer U
	? Result<U, E>
	: never;

/**
 * Safely executes a function or awaits a promise, capturing any errors
 *
 * This utility provides a consistent way to handle both synchronous and asynchronous
 * operations that might throw errors. It returns a Result object that can be checked
 * with isSuccess or isError.
 *
 * @template T The type of the successful result
 * @template E The type of the error, defaults to unknown
 * @template F The type of the function or promise
 * @param arg The function to execute or promise to await
 * @param handler Optional error handler or 'throw' to rethrow errors
 * @param cleanup Optional function to run after completion (in finally block)
 * @returns A Result object or Promise<Result> containing either data or error
 *
 * @example
 * ```ts
 * // Synchronous usage
 * const result = tryCatch(() => {
 *   return JSON.parse('{"valid": "json"}');
 * });
 *
 * // Asynchronous usage
 * const asyncResult = await tryCatch(async () => {
 *   const response = await fetch('https://api.example.com/data');
 *   return response.json();
 * });
 *
 * // With error handler
 * const result = tryCatch(
 *   () => riskyOperation(),
 *   (error) => console.error('Operation failed:', error)
 * );
 *
 * // With cleanup
 * const result = tryCatch(
 *   () => riskyOperation(),
 *   undefined,
 *   () => console.log('Operation completed')
 * );
 * ```
 */
export function tryCatch<T, E = unknown>(
	promise: Promise<T>,
	handler?: ((error: E) => void) | 'throw',
	cleanup?: () => void
): Promise<Result<T, E>>;

export function tryCatch<T, E = unknown>(
	fn: () => T,
	handler?: ((error: E) => void) | 'throw',
	cleanup?: () => void
): Result<T, E>;

export function tryCatch<T, F extends Promise<T> | (() => MaybePromise<T>), E = unknown>(
	arg: F,
	handler?: ((error: E) => void) | 'throw',
	cleanup?: () => void
): TryCatchReturn<T, E, F> {
	if (typeof arg === 'function') {
		try {
			const result = (arg as () => MaybePromise<T>)();
			if (result instanceof Promise) {
				return result
					.then((data) => ({ data }))
					.catch((error) => {
						if (handler === 'throw') throw error;
						if (handler) handler(error as E);
						return { error: error as E };
					})
					.finally(cleanup) as TryCatchReturn<T, E, F>;
			}
			const successResponse = { data: result };
			cleanup?.();
			return successResponse as TryCatchReturn<T, E, F>;
		} catch (error) {
			if (handler === 'throw') throw error;
			if (handler) handler(error as E);
			cleanup?.();
			return { error: error as E } as TryCatchReturn<T, E, F>;
		}
	}

	return (arg as Promise<T>)
		.then((data) => ({ data }))
		.catch((error) => {
			if (handler === 'throw') throw error;
			if (handler) handler(error as E);
			return { error: error as E };
		})
		.finally(cleanup) as TryCatchReturn<T, E, F>;
}

/**
 * Chains multiple operations that return Results, stopping at the first failure
 *
 * @template T The type of the input data
 * @template U The type of the output data
 * @template E The type of the error
 * @param input The input data or a Result containing the input data
 * @param operations The operations to chain
 * @returns A Result containing either the final success data or the first error
 *
 * @example
 * ```ts
 * const result = chain(
 *   "5", // Initial input
 *   input => tryCatch(() => parseInt(input)), // Convert to number
 *   num => tryCatch(() => num * 2), // Double it
 *   num => tryCatch(() => num.toString()) // Convert back to string
 * );
 * // result = { data: "10" }
 * ```
 */
export function chain<T, U, E>(
	input: T | Result<T, E>,
	...operations: Array<(input: any) => Result<any, E>>
): Result<U, E> {
	// Convert raw value to a Result if it's not already one
	let current: Result<any, E>;

	if (typeof input === 'object' && input !== null && ('data' in input || 'error' in input)) {
		current = input as Result<any, E>;
	} else {
		current = { data: input as T };
	}

	for (const operation of operations) {
		if (isError(current)) {
			return current;
		}
		current = operation(current.data);
	}

	return current as Result<U, E>;
}
