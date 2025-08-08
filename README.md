# @itsezz/try-catch

[![npm version](https://img.shields.io/npm/v/@itsezz/try-catch.svg)](https://www.npmjs.com/package/@itsezz/try-catch)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A lightweight TypeScript utility for handling errors using Result types, making your code cleaner and more predictable.

## Features

- Type-safe error handling with Result types
- Seamless sync and async operation support
- Explicit sync/async variants for better type inference
- Short aliases for convenience
- Zero dependencies

## Installation

```bash
npm install @itsezz/try-catch
# or
yarn add @itsezz/try-catch
# or
pnpm add @itsezz/try-catch
```

## Usage

```typescript
import { isError, isSuccess, tryCatch, tryCatchAsync, tryCatchSync, t, tc, tca } from '@itsezz/try-catch';

// Synchronous operations
const result = tryCatchSync(() => JSON.parse('{"name": "user"}'));
// Or using short alias:
const result2 = tc(() => JSON.parse('{"name": "user"}'));

if (isSuccess(result)) {
  console.log(result.data.name); // "user"
} else {
  console.error(result.error);
}

// Asynchronous operations
const asyncResult = await tryCatchAsync(async () => {
  const response = await fetch('/api/user');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
});
// Or using short alias:
const asyncResult2 = await tca(async () => {
  const response = await fetch('/api/user');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
});

if (isSuccess(asyncResult)) {
  return asyncResult.data;
} else {
  console.error(asyncResult.error);
  return { name: 'Unknown' };
}

// Generic tryCatch (auto-detects sync/async)
const syncResult = tryCatch(() => 'hello world');
const asyncResult3 = await tryCatch(async () => 'hello async world');
// Or using short alias:
const syncResult2 = t(() => 'hello world');
const asyncResult4 = await t(async () => 'hello async world');

// Functional composition
import { map, flatMap, unwrapOr, match, success, failure } from '@itsezz/try-catch';

const result = unwrapOr(
  map(
    flatMap(
      tc(() => JSON.parse('{"value": "42"}')), // Using short alias
      data => tc(() => parseInt(data.value))
    ),
    num => num * 2
  ),
  0
);

console.log(result); // 84

// Complex error handling with pattern matching
const processUser = (jsonString: string) => {
  const parseResult = tc(() => JSON.parse(jsonString));
  const nameResult = flatMap(parseResult, data => 
    data.name ? success(data.name) : failure('No name field')
  );
  const upperResult = map(nameResult, name => name.toUpperCase());
  
  return match(upperResult, {
    success: (name) => `Hello, ${name}!`,
    failure: (error) => `Error: ${error}`
  });
};
```

## API

### Functions

- **`tryCatch<T, E>(fn: () => T): Result<T, E>`**  
  Executes a synchronous function, capturing any errors.

- **`tryCatch<T, E>(fn: () => Promise<T>): Promise<Result<T, E>>`**  
  Executes an async function, capturing any errors.

- **`tryCatch<T, E>(promise: Promise<T>): Promise<Result<T, E>>`**  
  Awaits a promise, capturing any errors.

- **`tryCatchSync<T, E>(fn: () => T): Result<T, E>`**  
  Executes synchronous functions, guaranteeing sync Result return.

- **`tryCatchAsync<T, E>(fn: () => Promise<T>): Promise<Result<T, E>>`**  
  Executes an async function, guaranteeing Promise<Result> return.

- **`tryCatchAsync<T, E>(promise: Promise<T>): Promise<Result<T, E>>`**  
  Awaits a promise, guaranteeing Promise<Result> return.

> **Note**: `tryCatch` may not correctly infer if the result is `Promise<Result<T,E>>` or `Result<T,E>` in certain conditions and defaults to `Promise<Result<T,E>>` when unsure. Use explicit variants for guaranteed type safety.

### Short Aliases

- **`t`** - `tryCatch`
- **`tc`** - `tryCatchSync`  
- **`tca`** - `tryCatchAsync`

### Type Guards & Helpers

- **`isSuccess<T, E>(result: Result<T, E>): result is Success<T>`**  
  Type guard that narrows a result to Success type.

- **`isError<T, E>(result: Result<T, E>): result is Failure<E>`**  
  Type guard that narrows a result to Failure type.

- **`success<T>(data: T): Success<T>`**  
  Creates a success result with the given data.
  
- **`failure<E>(error: E): Failure<E>`**  
  Creates a failure result with the given error.

### Result Utility Functions

Functional approach with excellent type inference:

- **`map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E>`**  
  Transforms the data of a successful result. If the result is a failure, returns the failure unchanged.

- **`flatMap<T, U, E>(result: Result<T, E>, fn: (data: T) => Result<U, E>): Result<U, E>`**  
  Transforms the data using a function that returns a Result. Useful for chaining operations that might fail.

- **`unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T`**  
  Extracts the data from a successful result or returns a default value for failures.

- **`unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T`**  
  Extracts the data from a successful result or computes a default value using the error.

- **`match<T, E, U>(result: Result<T, E>, handlers: { success: (data: T) => U; failure: (error: E) => U }): U`**  
  Pattern matching for Result types - handles both success and failure cases in one expression.

## Module Support

Supports both ESM and CommonJS:

```javascript
// ESM
import { tryCatch } from '@itsezz/try-catch';

// CommonJS
const { tryCatch } = require('@itsezz/try-catch');
```

## Requirements

- Node.js ≥ 14

## License

MIT
