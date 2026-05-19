# @itsezz/try-catch

<div align="center">

[![npm version](https://img.shields.io/npm/v/@itsezz/try-catch?color=2563eb&style=flat-square)](https://www.npmjs.com/package/@itsezz/try-catch)
[![npm downloads](https://img.shields.io/npm/dm/@itsezz/try-catch?color=2563eb&style=flat-square)](https://www.npmjs.com/package/@itsezz/try-catch)
[![license](https://img.shields.io/npm/l/@itsezz/try-catch?color=10b981&style=flat-square)](https://github.com/itsEzz/try-catch/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178c6?style=flat-square)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/min/@itsezz/try-catch?color=f59e0b&style=flat-square)](https://bundlephobia.com/package/@itsezz/try-catch)

A lightweight TypeScript utility for elegant error handling using the **Result pattern**. Say goodbye to messy try/catch blocks and hello to type-safe, composable error management.

</div>

## Why Result Pattern?

- ✅ **Explicit errors** — every failure is a deliberate return value
- ✅ **Full type safety** — TypeScript knows exactly what's possible
- ✅ **Composable** — chain operations without nesting

## Installation

```bash
# npm
npm install @itsezz/try-catch

# pnpm
pnpm add @itsezz/try-catch

# yarn
yarn add @itsezz/try-catch
```

## Quick Start

```typescript
import { tryCatch, isSuccess } from '@itsezz/try-catch';

// Wrap any operation that might fail
const result = tryCatch(() => JSON.parse(userInput));

// Handle both cases explicitly
if (isSuccess(result)) {
  console.log('Parsed data:', result.data); // ✅ Fully typed!
} else {
  console.error('Parse failed:', result.error); // ✅ Error is typed!
}
```

## The Result Type

At the core is the `Result<T, E>` type — a discriminated union that represents either success or failure:

```typescript
type Result<T, E = Error> = 
  | { ok: true; data: T; error?: never }   // Success case
  | { ok: false; data?: never; error: E }; // Failure case
```

The `ok` property acts as a discriminant, enabling perfect type narrowing.

## Usage

### Synchronous Functions

```typescript
import { tryCatch, isSuccess } from '@itsezz/try-catch';

const result = tryCatch(() => {
  const data = fs.readFileSync('config.json', 'utf-8');
  return JSON.parse(data);
});

if (isSuccess(result)) {
  console.log(result.data); // TypeScript knows this is the read config file content
} else {
  console.error(result.error.message);
}
```

### Asynchronous Operations

```typescript
import { tryCatch, isError } from '@itsezz/try-catch';

const user = await tryCatch(fetch('/api/user').then(r => r.json()));

if (isError(user)) {
  handleError(user.error);
  return;
}

console.log(user.data.name); // Fully typed!
```

### Explicit Context

Need to guarantee sync or async? Use the specific variants:

```typescript
import { tryCatchSync, tryCatchAsync } from '@itsezz/try-catch';

// Always returns Result<T, E> (never a Promise)
const syncResult = tryCatchSync(() => expensiveCalculation());

// Always returns Promise<Result<T, E>>
const asyncResult = await tryCatchAsync(fetchUser(id));
```

## API Reference

### Core Functions

| Function          | Description                                      |
| ----------------- | ------------------------------------------------ |
| `tryCatch()  `    | Auto-detects sync/async and returns accordingly* |
| `tryCatchSync()`  | Guarantees synchronous `Result<T, E>`            |
| `tryCatchAsync()` | Guarantees `Promise<Result<T, E>>`               |
| `t()`             | Short alias for `tryCatch`                       |
| `tc()`            | Short alias for `tryCatchSync`                   |
| `tca()`           | Short alias for `tryCatchAsync`                  |

> \* `tryCatch` may not correctly infer if the result is `Promise<Result<T,E>>` or `Result<T,E>` in certain conditions and defaults to `Promise<Result<T,E>>` when unsure. Use explicit variants for guaranteed type safety.

### Type Guards

```typescript
isSuccess(result) // Returns true if ok === true
isError(result)   // Returns true if ok === false
```

### Transformation

```typescript
// Transform success data, pass through errors
map(result, (data) => data.toUpperCase())

// Chain another operation that might fail
flatMap(result, (data) => tryCatchSync(() => validate(data)))
```

### Combination

```typescript
const results = await Promise.all([
  tryCatchAsync(fetchUser(1)),
  tryCatchAsync(fetchUser(2)),
  tryCatchAsync(fetchUser(3)),
]);

// Returns all data if all succeed, or first error if any fail
const allUsers = all(results);
```

### Error Handling

```typescript
// Pattern matching
match(result, {
  success: (data) => process(data),
  failure: (error) => logError(error),
});

// Get data or default
const value = unwrapOr(result, defaultValue);

// Get data or compute from error
const value = unwrapOrElse(result, (error) => computeFallback(error));
```

## Examples

### Custom Error Types

```typescript
interface ApiError {
  code: number;
  message: string;
}

const result = tryCatchSync<User, ApiError>(() => {
  if (!user) throw { code: 404, message: 'User not found' };
  return user;
});

if (!result.ok) {
  // result.error is typed as ApiError
  console.log(result.error.code); // ✅ No type assertion needed!
}
```

### Safe JSON Parsing

```typescript
import { tryCatch } from '@itsezz/try-catch';

const safeJsonParse = <T>(json: string): T | null => {
  const result = tryCatch(() => JSON.parse(json) as T);
  return result.ok ? result.data : null;
};

// Usage
const config = safeJsonParse<Config>(rawJson);
if (config) {
  // Use config...
}
```

## License

MIT © [itsEzz](https://github.com/itsEzz)

---

<div align="center">

**⭐ If you find this useful, consider starring the repo! ⭐**

</div>