import {
	failure,
	flatMap,
	isError,
	isSuccess,
	map,
	match,
	Result,
	success,
	t,
	tc,
	tca,
	tryCatch,
	tryCatchAsync,
	tryCatchSync,
	unwrapOr,
	unwrapOrElse,
} from './index';

describe('Result Type Utilities', () => {
	describe('isSuccess', () => {
		it('should return true for success results', () => {
			const result = success('test data');
			expect(isSuccess(result)).toBe(true);
		});

		it('should return false for error results', () => {
			const result = failure(new Error('test error'));
			expect(isSuccess(result)).toBe(false);
		});
	});

	describe('isError', () => {
		it('should return true for error results', () => {
			const result = failure(new Error('test error'));
			expect(isError(result)).toBe(true);
		});

		it('should return false for success results', () => {
			const result = success('test data');
			expect(isError(result)).toBe(false);
		});
	});

	describe('ok property', () => {
		it('should be true for success results', () => {
			const result = success('test data');
			expect(result.ok).toBe(true);
		});

		it('should be false for error results', () => {
			const result = failure(new Error('test error'));
			expect(result.ok).toBe(false);
		});

		it('should enable type narrowing for success results', () => {
			const result: Result<string, Error> = success('test');
			if (result.ok) {
				const data: string = result.data;
				expect(typeof data).toBe('string');
			} else {
				fail('Result should be a success');
			}
		});

		it('should enable type narrowing for error results', () => {
			const error = new Error('test error');
			const result: Result<string, Error> = failure(error);
			if (!result.ok) {
				const err: Error = result.error;
				expect(err instanceof Error).toBe(true);
			} else {
				fail('Result should be a failure');
			}
		});

		it('should work with tryCatch results', () => {
			const successResult = tryCatch(() => 'data');
			expect(successResult.ok).toBe(true);

			const errorResult = tryCatchSync(() => {
				throw new Error('error');
			});
			expect(errorResult.ok).toBe(false);
		});

		it('should work with async tryCatch results', async () => {
			const successResult = await tryCatch(async () => 'async data');
			expect(successResult.ok).toBe(true);

			const errorResult = await tryCatchAsync(async () => {
				throw new Error('async error');
			});
			expect(errorResult.ok).toBe(false);
		});
	});
});

describe('Short Aliases', () => {
	describe('t (tryCatch alias)', () => {
		it('should work identically to tryCatch for sync functions', () => {
			const result = t(() => 'success');
			expect(isSuccess(result)).toBe(true);
			if (isSuccess(result)) {
				expect(result.data).toBe('success');
			}
		});

		it('should work identically to tryCatch for async functions', async () => {
			const result = await t(async () => 'async success');
			expect(isSuccess(result)).toBe(true);
			if (isSuccess(result)) {
				expect(result.data).toBe('async success');
			}
		});

		it('should work identically to tryCatch for promises', async () => {
			const promise = Promise.resolve('promise success');
			const result = await t(promise);
			expect(isSuccess(result)).toBe(true);
			if (isSuccess(result)) {
				expect(result.data).toBe('promise success');
			}
		});
	});

	describe('tc (tryCatchSync alias)', () => {
		it('should work identically to tryCatchSync', () => {
			const result = tc(() => 'sync success');
			expect(isSuccess(result)).toBe(true);
			if (isSuccess(result)) {
				expect(result.data).toBe('sync success');
			}
		});

		it('should handle errors identically to tryCatchSync', () => {
			const result = tc(() => {
				throw new Error('sync error');
			});
			expect(isError(result)).toBe(true);
			if (isError(result)) {
				expect(result.error).toBeInstanceOf(Error);
				expect((result.error as Error).message).toBe('sync error');
			}
		});
	});

	describe('tca (tryCatchAsync alias)', () => {
		it('should work identically to tryCatchAsync for async functions', async () => {
			const result = await tca(async () => 'async success');
			expect(isSuccess(result)).toBe(true);
			if (isSuccess(result)) {
				expect(result.data).toBe('async success');
			}
		});

		it('should work identically to tryCatchAsync for promises', async () => {
			const promise = Promise.resolve('promise success');
			const result = await tca(promise);
			expect(isSuccess(result)).toBe(true);
			if (isSuccess(result)) {
				expect(result.data).toBe('promise success');
			}
		});

		it('should handle errors identically to tryCatchAsync', async () => {
			const result = await tca(async () => {
				throw new Error('async error');
			});
			expect(isError(result)).toBe(true);
			if (isError(result)) {
				expect(result.error).toBeInstanceOf(Error);
				expect((result.error as Error).message).toBe('async error');
			}
		});
	});
});

describe('tryCatch', () => {
	describe('with synchronous functions', () => {
		it('should return success result for successful operations', () => {
			const result = tryCatch(() => 'success');
			expect(isSuccess(result)).toBe(true);
			expect(result.data).toBe('success');
		});

		it('should return error result for failed operations', () => {
			const result = tryCatch(() => {
				throw new Error('test error');
			});
			// @ts-expect-error Can't infer type in this case and will fallback to Promise<Result<T, E>>
			expect(isError(result)).toBe(true);
			// @ts-expect-error Can't infer type in this case and will fallback to Promise<Result<T, E>>
			if (isError(result)) {
				expect(result.error).toBeInstanceOf(Error);
				expect((result.error as Error).message).toBe('test error');
			}
		});
	});

	describe('with asynchronous functions', () => {
		it('should return success result for successful async operations', async () => {
			const result = await tryCatch(async () => 'async success');
			expect(isSuccess(result)).toBe(true);
			expect(result.data).toBe('async success');
		});

		it('should return error result for failed async operations', async () => {
			const result = await tryCatch(async () => {
				throw new Error('async error');
			});
			expect(isError(result)).toBe(true);
			if (isError(result)) {
				expect(result.error).toBeInstanceOf(Error);
				expect((result.error as Error).message).toBe('async error');
			}
		});
	});

	describe('with promises directly', () => {
		it('should handle resolved promises', async () => {
			const promise = Promise.resolve('promise success');
			const resultPromise = tryCatch(promise);
			expect(resultPromise instanceof Promise).toBe(true);

			const result = await resultPromise;
			expect(isSuccess(result)).toBe(true);
			if (isSuccess(result)) {
				expect(result.data).toBe('promise success');
			}
		});

		it('should handle rejected promises', async () => {
			const promise = Promise.reject(new Error('promise error'));
			const resultPromise = tryCatch(promise);
			expect(resultPromise instanceof Promise).toBe(true);

			const result = await resultPromise;
			expect(isError(result)).toBe(true);
			if (isError(result)) {
				expect(result.error).toBeInstanceOf(Error);
				expect((result.error as Error).message).toBe('promise error');
			}
		});
	});

	describe('edge cases', () => {
		it('should handle non-Error objects thrown', () => {
			const result = tryCatch(() => {
				throw 'string error';
			});
			// @ts-expect-error Can't infer type in this case and will fallback to Promise<Result<T, E>>
			expect(isError(result)).toBe(true);
			// @ts-expect-error Can't infer type in this case and will fallback to Promise<Result<T, E>>
			if (isError(result)) {
				expect(result.error).toBe('string error');
			}
		});

		it('should handle null and undefined return values', () => {
			const nullResult = tryCatch(() => null);
			expect(isSuccess(nullResult)).toBe(true);
			if (isSuccess(nullResult)) {
				expect(nullResult.data).toBeNull();
			}

			const undefinedResult = tryCatch(() => undefined);
			expect(isSuccess(undefinedResult)).toBe(true);
			if (isSuccess(undefinedResult)) {
				expect(undefinedResult.data).toBeUndefined();
			}
		});

		it('should handle complex return values', () => {
			const complexObject = { nested: { array: [1, 2, 3], value: 'test' } };
			const result = tryCatch(() => complexObject);
			expect(isSuccess(result)).toBe(true);
			if (isSuccess(result)) {
				expect(result.data).toEqual(complexObject);
			}
		});
	});
});

describe('Success and Failure Constructors', () => {
	describe('success', () => {
		it('should create a success result', () => {
			const result = success('test data');
			expect(isSuccess(result)).toBe(true);
			if (isSuccess(result)) {
				expect(result.data).toBe('test data');
			}
		});

		it('should work with different data types', () => {
			const numberResult = success(42);
			const objectResult = success({ key: 'value' });
			const arrayResult = success([1, 2, 3]);

			expect(isSuccess(numberResult)).toBe(true);
			expect(isSuccess(objectResult)).toBe(true);
			expect(isSuccess(arrayResult)).toBe(true);

			if (isSuccess(numberResult)) expect(numberResult.data).toBe(42);
			if (isSuccess(objectResult)) expect(objectResult.data).toEqual({ key: 'value' });
			if (isSuccess(arrayResult)) expect(arrayResult.data).toEqual([1, 2, 3]);
		});
	});

	describe('failure', () => {
		it('should create a failure result', () => {
			const error = new Error('test error');
			const result = failure(error);
			expect(isError(result)).toBe(true);
			if (isError(result)) {
				expect(result.error).toBe(error);
			}
		});

		it('should work with different error types', () => {
			const stringError = failure('string error');
			const customError = failure({ code: 404, message: 'Not found' });

			expect(isError(stringError)).toBe(true);
			expect(isError(customError)).toBe(true);

			if (isError(stringError)) expect(stringError.error).toBe('string error');
			if (isError(customError)) expect(customError.error).toEqual({ code: 404, message: 'Not found' });
		});
	});
});

describe('tryCatchSync', () => {
	it('should return success result for successful sync operations', () => {
		const result = tryCatchSync(() => 'sync success');
		expect(isSuccess(result)).toBe(true);
		if (isSuccess(result)) {
			expect(result.data).toBe('sync success');
		}
	});

	it('should return error result for failed sync operations', () => {
		const result = tryCatchSync(() => {
			throw new Error('sync error');
		});
		expect(isError(result)).toBe(true);
		if (isError(result)) {
			expect(result.error).toBeInstanceOf(Error);
			expect((result.error as Error).message).toBe('sync error');
		}
	});

	it('should handle non-Error objects thrown', () => {
		const result = tryCatchSync(() => {
			throw 'string error';
		});
		expect(isError(result)).toBe(true);
		if (isError(result)) {
			expect(result.error).toBe('string error');
		}
	});

	it('should handle null and undefined return values', () => {
		const nullResult = tryCatchSync(() => null);
		expect(isSuccess(nullResult)).toBe(true);
		if (isSuccess(nullResult)) {
			expect(nullResult.data).toBeNull();
		}

		const undefinedResult = tryCatchSync(() => undefined);
		expect(isSuccess(undefinedResult)).toBe(true);
		if (isSuccess(undefinedResult)) {
			expect(undefinedResult.data).toBeUndefined();
		}
	});
});

describe('tryCatchAsync', () => {
	it('should return success result for successful async operations', async () => {
		const result = await tryCatchAsync(async () => 'async success');
		expect(isSuccess(result)).toBe(true);
		if (isSuccess(result)) {
			expect(result.data).toBe('async success');
		}
	});

	it('should return error result for failed async operations', async () => {
		const result = await tryCatchAsync(async () => {
			throw new Error('async error');
		});
		expect(isError(result)).toBe(true);
		if (isError(result)) {
			expect(result.error).toBeInstanceOf(Error);
			expect((result.error as Error).message).toBe('async error');
		}
	});

	it('should handle resolved promises directly', async () => {
		const promise = Promise.resolve('promise success');
		const result = await tryCatchAsync(promise);
		expect(isSuccess(result)).toBe(true);
		if (isSuccess(result)) {
			expect(result.data).toBe('promise success');
		}
	});

	it('should handle rejected promises directly', async () => {
		const promise = Promise.reject(new Error('promise error'));
		const result = await tryCatchAsync(promise);
		expect(isError(result)).toBe(true);
		if (isError(result)) {
			expect(result.error).toBeInstanceOf(Error);
			expect((result.error as Error).message).toBe('promise error');
		}
	});

	it('should handle non-Error objects thrown in async functions', async () => {
		const result = await tryCatchAsync(async () => {
			throw 'async string error';
		});
		expect(isError(result)).toBe(true);
		if (isError(result)) {
			expect(result.error).toBe('async string error');
		}
	});
});

describe('Type Safety', () => {
	it('should properly type guard success results', () => {
		const result: Result<string, Error> = success('test');

		if (isSuccess(result)) {
			const data: string = result.data;
			expect(typeof data).toBe('string');
		} else {
			fail('Result should be a success');
		}
	});

	it('should properly type guard error results', () => {
		const error = new Error('test error');
		const result: Result<string, Error> = failure(error);

		if (isError(result)) {
			const err: Error = result.error;
			expect(err instanceof Error).toBe(true);
		} else {
			fail('Result should be a failure');
		}
	});

	it('should handle custom error types', () => {
		interface CustomError {
			code: number;
			message: string;
		}

		const customError: CustomError = { code: 500, message: 'Server error' };
		const result: Result<string, CustomError> = failure(customError);

		if (isError(result)) {
			const err: CustomError = result.error;
			expect(err.code).toBe(500);
			expect(err.message).toBe('Server error');
		} else {
			fail('Result should be a failure');
		}
	});
});

describe('Result Utility Methods', () => {
	describe('map', () => {
		it('should transform successful results', () => {
			const result = success(5);
			const mapped = map(result, (x) => x * 2);

			expect(isSuccess(mapped)).toBe(true);
			if (isSuccess(mapped)) {
				expect(mapped.data).toBe(10);
			}
		});

		it('should pass through failures unchanged', () => {
			const error = new Error('test error');
			const result = failure(error);
			const mapped = map(result, (x: number) => x * 2);

			expect(isError(mapped)).toBe(true);
			if (isError(mapped)) {
				expect(mapped.error).toBe(error);
			}
		});

		it('should handle type transformations', () => {
			const result = success(42);
			const mapped = map(result, (x) => x.toString());

			expect(isSuccess(mapped)).toBe(true);
			if (isSuccess(mapped)) {
				expect(mapped.data).toBe('42');
				expect(typeof mapped.data).toBe('string');
			}
		});
	});

	describe('flatMap', () => {
		it('should chain successful operations', () => {
			const result = success(5);
			const chained = flatMap(result, (x) => success(x * 2));

			expect(isSuccess(chained)).toBe(true);
			if (isSuccess(chained)) {
				expect(chained.data).toBe(10);
			}
		});

		it('should handle failures in the chain', () => {
			const result = success(5);
			const error = new Error('chain error');
			const chained = flatMap(result, () => failure(error));

			expect(isError(chained)).toBe(true);
			if (isError(chained)) {
				expect(chained.error).toBe(error);
			}
		});

		it('should pass through original failures', () => {
			const error = new Error('original error');
			const result = failure(error);
			const chained = flatMap(result, (x: number) => success(x * 2));

			expect(isError(chained)).toBe(true);
			if (isError(chained)) {
				expect(chained.error).toBe(error);
			}
		});

		it('should enable complex chaining', () => {
			const parseNumber = (str: string): Result<number, string> => {
				const num = parseInt(str, 10);
				return isNaN(num) ? failure('Not a number') : success(num);
			};

			const double = (x: number): Result<number, string> => success(x * 2);

			const result1 = flatMap(success('5'), parseNumber);
			const result2 = flatMap(result1, double);

			expect(isSuccess(result2)).toBe(true);
			if (isSuccess(result2)) {
				expect(result2.data).toBe(10);
			}

			const result3 = flatMap(success('not-a-number'), parseNumber);
			expect(isError(result3)).toBe(true);
			if (isError(result3)) {
				expect(result3.error).toBe('Not a number');
			}
		});
	});

	describe('unwrapOr', () => {
		it('should return data for successful results', () => {
			const result = success('hello');
			const value = unwrapOr(result, 'default');

			expect(value).toBe('hello');
		});

		it('should return default value for failures', () => {
			const result = failure(new Error('test error'));
			const value = unwrapOr(result, 'default');

			expect(value).toBe('default');
		});

		it('should work with different types', () => {
			const numberResult = success(42);
			const numberValue = unwrapOr(numberResult, 0);
			expect(numberValue).toBe(42);

			const failedNumberResult = failure('error');
			const defaultNumber = unwrapOr(failedNumberResult, 0);
			expect(defaultNumber).toBe(0);
		});
	});

	describe('unwrapOrElse', () => {
		it('should return data for successful results', () => {
			const result = success('hello');
			const value = unwrapOrElse(result, () => 'computed default');

			expect(value).toBe('hello');
		});

		it('should compute default value using error for failures', () => {
			const error = new Error('test error');
			const result = failure(error);
			const value = unwrapOrElse(result, (err) => `Error: ${(err as Error).message}`);

			expect(value).toBe('Error: test error');
		});

		it('should work with custom error types', () => {
			interface CustomError {
				code: number;
				message: string;
			}

			const customError: CustomError = { code: 404, message: 'Not found' };
			const result = failure(customError);
			const value = unwrapOrElse(result, (err) => `${err.code}: ${err.message}`);

			expect(value).toBe('404: Not found');
		});
	});

	describe('match', () => {
		it('should handle successful results', () => {
			const result = success('hello');
			const message = match(result, {
				success: (data) => `Success: ${data}`,
				failure: (error) => `Error: ${error}`,
			});

			expect(message).toBe('Success: hello');
		});

		it('should handle failed results', () => {
			const error = new Error('test error');
			const result = failure(error);
			const message = match(result, {
				success: (data) => `Success: ${data}`,
				failure: (err) => `Error: ${(err as Error).message}`,
			});

			expect(message).toBe('Error: test error');
		});

		it('should work with different return types', () => {
			const successResult = success(42);
			const failureResult = failure('error');

			const successLength = match(successResult, {
				success: (data) => data.toString().length,
				failure: () => 0,
			});

			const failureLength = match(failureResult, {
				success: (data: number) => data.toString().length,
				failure: () => 0,
			});

			expect(successLength).toBe(2); // "42".length
			expect(failureLength).toBe(0);
		});

		it('should enable complex pattern matching', () => {
			interface User {
				name: string;
				age: number;
			}

			const userResult = success({ name: 'John', age: 30 });
			const errorResult = failure({ code: 404, message: 'User not found' });

			const userMessage = match(userResult, {
				success: (user) => `Hello ${user.name}, you are ${user.age} years old`,
				failure: (err: { code: number; message: string }) => `Error ${err.code}: ${err.message}`,
			});

			const errorMessage = match(errorResult, {
				success: (user: User) => `Hello ${user.name}, you are ${user.age} years old`,
				failure: (err: { code: number; message: string }) => `Error ${err.code}: ${err.message}`,
			});

			expect(userMessage).toBe('Hello John, you are 30 years old');
			expect(errorMessage).toBe('Error 404: User not found');
		});
	});
});
