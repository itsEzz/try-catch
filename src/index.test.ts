import { failure, isError, isSuccess, Result, success, tryCatch, tryCatchAsync, tryCatchSync } from './index';

describe('Result Type Utilities', () => {
	describe('isSuccess', () => {
		it('should return true for success results', () => {
			const result = { data: 'test data' };
			expect(isSuccess(result)).toBe(true);
		});

		it('should return false for error results', () => {
			const result = { error: new Error('test error') };
			expect(isSuccess(result)).toBe(false);
		});
	});

	describe('isError', () => {
		it('should return true for error results', () => {
			const result = { error: new Error('test error') };
			expect(isError(result)).toBe(true);
		});

		it('should return false for success results', () => {
			const result = { data: 'test data' };
			expect(isError(result)).toBe(false);
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
			expect(isError(result)).toBe(true);
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
			expect(isError(result)).toBe(true);
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
