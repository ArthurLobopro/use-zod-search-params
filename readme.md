# use-zod-search-params

A small React Hook to synchronize and validate URL search parameters using `react-router-dom` and `zod`.

---

## Installation

Install the package. `react`, `react-router-dom` and `zod` are peer dependencies, so install them in your project too (if you do not have them already):

```bash
npm install @arthur-lobo/use-zod-search-params react react-router-dom zod
# or
yarn add @arthur-lobo/use-zod-search-params react react-router-dom zod
```

> Ensure your project is using a React Router version that supports `useSearchParams`.

---

## Usage

Basic TypeScript example:

```tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { z } from "zod";
import { useZodSearchParams } from "@arthur-lobo/use-zod-search-params";

// Every property must have .nullable() or .default()
const schema = z.object({
  q: z.string().nullable(),
  page: z.coerce.number().default(1),
  show: z.coerce.boolean().nullable(),
  sort: z.enum(["asc", "desc"]).default("asc"),
});

function SearchPage() {
  const { 
    params: { q, page },
    setParams,
    setters: { setPage }
  } = useZodSearchParams(schema);

  return (
    <div>
      <h2>Query: {q}</h2>
      <p>Page: {page}</p>
      <button onClick={() => setPage(page + 1)}>Next page</button>
      <button onClick={() => setParams({ q: "", page: 1 })}>Clear Filters</button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SearchPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### API

- `params` — parsed and validated values from the URL (result of `schema.parse(...)`).
- `setters` — an object with auto-generated setters in the form `set<Key>`.
- `setParams` — partial updater that merges values into the current query params.

---

## Supported Zod types

The hook supports fields using:

- `z.string()`
- `z.coerce.number()`
- `z.coerce.boolean()`
- `z.enum([...])`

Every property must have `.nullable()` or `.default()`. Otherwise, the function will display a TypeScript error.

---

## Notes

- Empty values in the query string are ignored before parsing.
- Use Zod coercion (`z.coerce.*`) to convert string query values into numbers and booleans.

---

## Contributing

PRs and issues are welcome. Please include a description and reproduction steps for bugs.

Run the checks before opening a PR:

```bash
bun run lint
bun run test           # unit tests (Vitest)
bun run test:coverage  # tests with coverage report
```

