import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { act, renderSearchParams } from "./setup";

const schema = z.object({
  q: z.string().nullable(),
  page: z.coerce.number().default(1),
  show: z.coerce.boolean().nullable(),
  sort: z.enum(["asc", "desc"]).default("asc"),
});

const swallowWindowError = (event: Event) => event.preventDefault();

/**
 * Hides the noise of errors a test expects: React logs them to the console and
 * jsdom prints them again when they are reported to `window`, even after a
 * boundary has caught them.
 */
function silenceReactErrors() {
  vi.spyOn(console, "error").mockImplementation(() => {});
  window.addEventListener("error", swallowWindowError);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.removeEventListener("error", swallowWindowError);
});

describe("reading params", () => {
  it("returns defaults and null when the URL is empty", () => {
    const t = renderSearchParams(schema);

    expect({ ...t.current.params }).toEqual({
      q: null,
      page: 1,
      show: null,
      sort: "asc",
    });
  });

  it("parses valid values of every supported type", () => {
    const t = renderSearchParams(
      schema,
      "/?q=hello&page=3&show=true&sort=desc",
    );

    expect({ ...t.current.params }).toEqual({
      q: "hello",
      page: 3,
      show: true,
      sort: "desc",
    });
  });

  it("treats an empty value as missing", () => {
    const t = renderSearchParams(schema, "/?q=&sort=");

    expect(t.current.params.q).toBeNull();
    expect(t.current.params.sort).toBe("asc");
  });

  it("cleans invalid values from the URL and falls back", async () => {
    const t = renderSearchParams(schema, "/?page=abc&sort=up&q=keep");
    await t.flush();

    expect(t.current.params.page).toBe(1);
    expect(t.current.params.sort).toBe("asc");
    expect(t.search).toBe("?q=keep");
  });

  it("keeps params that are not part of the schema", async () => {
    const t = renderSearchParams(schema, "/?page=abc&other=1");
    await t.flush();

    expect(t.search).toBe("?other=1");
  });

  it("cleans the URL with replace, not push", async () => {
    const t = renderSearchParams(schema, "/?page=abc");
    await t.flush();

    expect(t.historyAction).toBe("REPLACE");
  });

  it("throws on invalid values when onParseError is 'throw'", async () => {
    silenceReactErrors();

    const t = renderSearchParams(schema, "/?page=abc", {
      onParseError: "throw",
    });
    await t.flush();

    expect(t.routeError).toBeInstanceOf(z.ZodError);
    expect(t.search).toBe("?page=abc");
  });

  it("falls back on invalid values read before the URL is cleaned", () => {
    const firstRead: unknown[] = [];

    renderSearchParams(schema, "/?page=abc", {}, (result) => {
      firstRead.push(result.params.page);
    });

    expect(firstRead[0]).toBe(1);
  });

  it("throws from the getter when onParseError is 'throw'", () => {
    silenceReactErrors();
    const errors: unknown[] = [];

    renderSearchParams(schema, "/?page=abc", { onParseError: "throw" }, (r) => {
      try {
        r.params.page;
      } catch (error) {
        errors.push(error);
      }
    });

    expect(errors[0]).toBeInstanceOf(z.ZodError);
  });
});

describe("setting params", () => {
  it("sets a single value with a setter and pushes history", async () => {
    const t = renderSearchParams(schema);

    act(() => t.current.setters.setPage(4));
    await t.flush();

    expect(t.current.params.page).toBe(4);
    expect(t.search).toBe("?page=4");
    expect(t.historyAction).toBe("PUSH");
  });

  it("removes the param when set to '' or null", async () => {
    const t = renderSearchParams(schema, "/?q=hello&show=true");

    act(() => t.current.setters.setQ(""));
    await t.flush();
    act(() => t.current.setters.setShow(null));
    await t.flush();

    expect(t.search).toBe("");
    expect(t.current.params.q).toBeNull();
    expect(t.current.params.show).toBeNull();
  });

  it("merges values with setParams, keeping the others", async () => {
    const t = renderSearchParams(schema, "/?sort=desc&other=1");

    act(() => t.current.setParams({ q: "x", page: 2 }));
    await t.flush();

    expect(t.search).toBe("?sort=desc&other=1&q=x&page=2");
  });

  it("throws on invalid values by default", () => {
    const t = renderSearchParams(schema);

    expect(() =>
      // @ts-expect-error invalid enum value on purpose
      act(() => t.current.setters.setSort("up")),
    ).toThrow();
  });

  it("ignores invalid values when onSetValueError is 'ignore'", async () => {
    const t = renderSearchParams(schema, "/?sort=desc", {
      onSetValueError: "ignore",
    });

    // @ts-expect-error invalid enum value on purpose
    act(() => t.current.setParams({ sort: "up", page: 2 }));
    await t.flush();

    expect(t.search).toBe("?sort=desc&page=2");
  });

  it("keeps default values in the URL when clearDefaults is off", async () => {
    const t = renderSearchParams(schema, "/?page=1");

    act(() => t.current.setters.setSort("asc"));
    await t.flush();

    expect(t.search).toBe("?page=1&sort=asc");
  });

  it("removes default values when clearDefaults is on", async () => {
    const t = renderSearchParams(schema, "/?page=1&sort=desc", {
      clearDefaults: true,
    });
    await t.flush();
    expect(t.search).toBe("?sort=desc");

    act(() => t.current.setters.setSort("asc"));
    await t.flush();
    expect(t.search).toBe("");
  });
});

describe("booleans", () => {
  const boolSchema = z.object({ flag: z.coerce.boolean().default(true) });

  it("reads 'false' from the URL as false", () => {
    const t = renderSearchParams(boolSchema, "/?flag=false");

    expect(t.current.params.flag).toBe(false);
  });

  it("round-trips false through a setter", async () => {
    const t = renderSearchParams(boolSchema);

    act(() => t.current.setters.setFlag(false));
    await t.flush();

    expect(t.search).toBe("?flag=false");
    expect(t.current.params.flag).toBe(false);
  });

  it("clears false as a default when clearDefaults is on", async () => {
    const falseDefault = z.object({ flag: z.coerce.boolean().default(false) });
    const t = renderSearchParams(falseDefault, "/?flag=false", {
      clearDefaults: true,
    });
    await t.flush();

    expect(t.search).toBe("");
  });
});

describe("defaults combined with nullable", () => {
  const combined = z.object({
    a: z.coerce.number().nullable().default(5),
    b: z.coerce.number().default(10).nullable(),
  });

  it("reads the default in both wrapper orders", () => {
    const t = renderSearchParams(combined);

    expect(t.current.params.a).toBe(5);
    expect(t.current.params.b).toBe(10);
  });

  it("applies clearDefaults in both wrapper orders", async () => {
    const t = renderSearchParams(combined, "/?a=5&b=10", {
      clearDefaults: true,
    });
    await t.flush();

    expect(t.search).toBe("");
  });
});

describe("consecutive updates", () => {
  it("keeps every update made in the same tick", async () => {
    const t = renderSearchParams(schema);

    act(() => {
      t.current.setters.setPage(3);
      t.current.setters.setQ("x");
      t.current.setParams({ sort: "desc" });
    });
    await t.flush();

    expect({ ...t.current.params }).toMatchObject({
      page: 3,
      q: "x",
      sort: "desc",
    });
  });

  it("follows the URL again after an external navigation", async () => {
    const t = renderSearchParams(schema);

    act(() => t.current.setters.setQ("x"));
    await t.flush();
    await t.navigate("/?page=7");

    act(() => t.current.setters.setSort("desc"));
    await t.flush();

    expect(t.search).toBe("?page=7&sort=desc");
  });

  it("keeps setters stable across URL changes", async () => {
    const t = renderSearchParams(schema);
    const before = t.current.setters;

    act(() => t.current.setters.setPage(2));
    await t.flush();

    expect(t.current.setters).toBe(before);
  });
});

describe("setter names", () => {
  it("converts snake_case keys to camelCase setters", () => {
    const named = z.object({
      q: z.string().nullable(),
      page_items: z.coerce.number().default(10),
      item_2: z.string().nullable(),
    });
    const t = renderSearchParams(named);

    expect(Object.keys(t.current.setters).sort()).toEqual([
      "setItem2",
      "setPageItems",
      "setQ",
    ]);
  });
});
