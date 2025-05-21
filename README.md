# @itsezz/try-catch

[![npm version](https://img.shields.io/npm/v/@itsezz/try-catch.svg)](https://www.npmjs.com/package/@itsezz/try-catch)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A lightweight TypeScript utility for handling errors using Result types, making your code cleaner and more predictable.

## Why Use This?

Traditional try/catch blocks often lead to error-prone patterns, early returns, and hard-to-follow control flow. This utility:

- Enforces explicit error handling through type safety
- Works seamlessly with both sync and async operations
- Eliminates forgotten try/catch blocks
- Creates more readable and maintainable code

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
import { tryCatch, isSuccess, isError } from '@itsezz/try-catch';

// Synchronous example
const result = tryCatch(() => JSON.parse('{"name": "user"}'));

if (isSuccess(result)) {
  // TypeScript knows result.data is the parsed JSON
  console.log(result.data.name); // "user"
} else {
  // TypeScript knows result.error is the caught error
  console.error(result.error);
}

// Async example
async function fetchUser(id) {
  const result = await tryCatch(async () => {
    const response = await fetch(`https://api.example.com/users/${id}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return response.json();
  });

  // Type-safe error handling
  if (isSuccess(result)) {
    return result.data;
  } else {
    // Log error and return fallback
    console.error(result.error);
    return { name: 'Unknown User' };
  }
}
```

## API

### Core Functions

- **`tryCatch<T, E>(fn: () => T): Result<T, E>`**  
  Executes a synchronous function, capturing any errors.

- **`tryCatch<T, E>(fn: () => Promise<T>): Promise<Result<T, E>>`**  
  Executes an async function, capturing any errors.

- **`tryCatch<T, E>(promise: Promise<T>): Promise<Result<T, E>>`**  
  Awaits a promise, capturing any errors.

### Type Guards

- **`isSuccess<T, E>(result: Result<T, E>): result is Success<T>`**  
  Type guard that narrows a result to Success type.

- **`isError<T, E>(result: Result<T, E>): result is Failure<E>`**  
  Type guard that narrows a result to Failure type.

### Helper Functions

- **`success<T>(data: T): Success<T>`**  
  Creates a success result with the given data.

- **`failure<E>(error: E): Failure<E>`**  
  Creates a failure result with the given error.

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
