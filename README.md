# @itsezz/try-catch

[![npm version](https://img.shields.io/npm/v/@itsezz/try-catch?color=2563eb&style=flat-square)](https://www.npmjs.com/package/@itsezz/try-catch)
[![npm downloads](https://img.shields.io/npm/dm/@itsezz/try-catch?color=2563eb&style=flat-square)](https://www.npmjs.com/package/@itsezz/try-catch)
[![license](https://img.shields.io/npm/l/@itsezz/try-catch?color=10b981&style=flat-square)](https://github.com/itsEzz/try-catch/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178c6?style=flat-square)](https://www.typescriptlang.org/)

Type-safe error handling with the **Result pattern** — no more `try/catch` soup.

```typescript
import { tryCatch } from '@itsezz/try-catch';

const result = tryCatch(() => JSON.parse(input) as { name: string });

if (result.ok) {
  console.log(result.data.name); // data is { name: string }
} else {
  console.error(result.error); // error is unknown
}
```

## Install

```bash
npm install @itsezz/try-catch
```

## Core

`Result<T, E>` is a discriminated union: `{ ok: true; data: T } | { ok: false; error: E }`.
Narrow it with `result.ok`, `isSuccess`, or `isError`.

```typescript
import { tryCatch, tryCatchSync, tryCatchAsync } from '@itsezz/try-catch';

// Auto-detects sync/async
const a = tryCatch(() => JSON.parse(input) as { name: string });
const b = await tryCatch(fetch('/api/user').then((r) => r.json() as Promise<{ name: string }>));

// Explicit variants when you want a guaranteed shape
const syncResult = tryCatchSync(() => expensiveCalculation()); // Result<T, E>, never a Promise
const asyncResult = await tryCatchAsync(fetchUser(id)); // Promise<Result<T, E>>
```

> `tryCatchSync` rejects async functions at both type and runtime —
> use `tryCatch` or `tryCatchAsync` for those.

## Transform

```typescript
import { map, flatMap, mapError, all } from '@itsezz/try-catch';

// Say result is Result<string, E>
map(result, (data) => data.toUpperCase()); // transform data, skip errors
flatMap(result, (data) => tryCatchSync(() => validate(data))); // chain fallible ops
mapError(result, (err) => ({ code: 500, message: String(err) })); // normalize errors

// Combine many results: all data on success, first error otherwise
all(await Promise.all([tryCatchAsync(fetchUser(1)), tryCatchAsync(fetchUser(2))]));
```

## Observe

Side effects that never change the result. Errors and rejections are swallowed.

```typescript
import { tap, tapAsync } from '@itsezz/try-catch';

tap(result, (r) => console.log(r)); // sync, returns result immediately
tap(result, { success: (d) => log(d), failure: (e) => alert(e) }); // branch handlers

await tapAsync(result, async (r) => sendMetric(r)); // awaited version
```

## Finish

```typescript
import { match, unwrapOr, unwrapOrElse } from '@itsezz/try-catch';

match(result, {
  success: (data) => render(data),
  failure: (error) => showError(error),
});

unwrapOr(result, fallback); // data or default
unwrapOrElse(result, (error) => fallbackFrom(error)); // data or computed default
```

## Chain

Opt-in fluent wrapper over the same functions above.
`chain()` is idempotent, frozen, and `toResult()` returns the plain `Result`.

```typescript
import { chain, tryCatchSync } from '@itsezz/try-catch';

const message = chain(tryCatchSync(() => JSON.parse(input) as { name: string }))
  .map((data) => data.name)
  .mapError((err) => `parse failed: ${String(err)}`)
  .tap({ failure: (e) => console.error(e) })
  .match({ success: (name) => `hi ${name}`, failure: (e) => e });
```

## API

| Export                                         | Description                               |
| ---------------------------------------------- | ----------------------------------------- |
| `tryCatch`, `tryCatchSync`, `tryCatchAsync`    | Capture sync/async failures into `Result` |
| `success`, `failure`                           | Construct results                         |
| `isSuccess`, `isError`                         | Type guards (`result.ok` also narrows)    |
| `map`, `flatMap`, `mapError`, `all`            | Transform and combine                     |
| `tap`, `tapAsync`                              | Side effects, result unchanged            |
| `match`, `unwrapOr`, `unwrapOrElse`            | Consume results                           |
| `chain`                                        | Fluent wrapper (`ChainedResult`)          |
| `t`, `tc`, `tca`                               | Short aliases                             |
| `Result`, `Success`, `Failure`, `MaybePromise` | Types                                     |

## License

MIT © [itsEzz](https://github.com/itsEzz)

