# @itsezz/try-catch

[![npm version](https://img.shields.io/npm/v/@itsezz/try-catch.svg)](https://npmjs.com/package/@itsezz/try-catch)

Type-safe error handling for TypeScript. No more `try/catch` blocks.

## Install

```bash
npm install @itsezz/try-catch
```

## Result Types

```typescript
type Result<T, E = Error> = Success<T> | Failure<E>;

type Success<T> = { data: T; error?: never; ok: true };
type Failure<E> = { data?: never; error: E; ok: false };
```

Use `result.ok` to check success/failure with full TypeScript narrowing.

## Quick Start

```typescript
import { tryCatch } from '@itsezz/try-catch';

// Sync
const result = tryCatch(() => JSON.parse('{"name":"user"}'));

if (result.ok) console.log(result.data.name); // "user"
else console.error(result.error);

// Async
const user = await tryCatch(fetch('/api/user').then(r => r.json()));

if (user.ok) return user.data;
return null;
```

## API

### Functions

| Function          | Short alias | Returns                     | Description             |
| ----------------- | ----------- | --------------------------- | ----------------------- |
| `tryCatch()`      | `t()`       | `Result \| Promise<Result>` | Auto-detects sync/async |
| `tryCatchSync()`  | `tc()`      | `Result`                    | Guaranteed sync         |
| `tryCatchAsync()` | `tca()`     | `Promise<Result>`           | Guaranteed async        |

### Create Results

```typescript
success(42)     // { data: 42, ok: true }
failure('err')  // { error: 'err', ok: false }
```

### Check Results

```typescript
if (result.ok) result.data; // Success<T>
else result.error;          // Failure<E>

isSuccess(result);  // type guard
isError(result);    // type guard
```

### Transform Results

```typescript
map(result, fn)             // transform success value
flatMap(result, fn)         // chain operations returning Result
unwrapOr(result, default)   // get value or default
unwrapOrElse(result, fn)    // get value or compute from error
match(result, {             // pattern matching
  success: (data) => ...,
  failure: (error) => ...
})
```

## Examples

### Safe JSON Parsing

```typescript
const json = tryCatch(() => JSON.parse(input));

if (!json.ok) return { error: 'Invalid JSON' };
return json.data;
```

### API Request with Type Safety

```typescript
interface User {
  id: number;
  name: string;
}

const fetchUser = async (): Promise<User | null> => {
  const result = await tryCatch(fetch('/api/user').then(r => r.json()));
  if (result.ok) return result.data;
  return null;
};
```

### Validation

```typescript
const validate = (input: unknown): Result<User, string[]> => {
  const parsed = tryCatch(() => JSON.parse(input as string));
  if (!parsed.ok) return failure(['Invalid JSON']);

  const errors: string[] = [];
  if (!parsed.data.name) errors.push('Name required');

  return errors.length > 0 ? failure(errors) : success(parsed.data);
};
```

### Functional Pipeline

```typescript
const result = unwrapOr(
  flatMap(success('42'), s => success(parseInt(s))),
  0
); // 84
```

## FAQ

**Default error type?** `Error`. Use generics for custom types:
```typescript
tryCatch<number, ApiError>(() => fetchData())
```

**When to use each variant?**
- `tryCatch`: Don't care about sync/async distinction
- `tryCatchSync`: Need guaranteed sync return
- `tryCatchAsync`: Need guaranteed `Promise<Result>` return

## License

MIT
