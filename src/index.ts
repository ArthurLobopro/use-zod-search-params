import { type MutableRefObject, useEffect, useMemo, useRef } from "react";
import { type SetURLSearchParams, useSearchParams } from "react-router-dom";
import type { z } from "zod";
import type { AllowedTypes, SetterName, UseZodSearchOptions } from "./types";

const DEFAULT_OPTIONS = {
  onParseError: "clean",
  onSetValueError: "throw",
  clearDefaults: false,
} satisfies UseZodSearchOptions;

/**
 * Tracks the most recent search params, including updates that were
 * requested but not rendered yet. react-router's `setSearchParams` (even the
 * functional form) builds on the params of the last render, so two setters
 * called in the same tick would overwrite each other without this.
 */
interface ParamsState {
  source: URLSearchParams;
  latest: URLSearchParams;
}

interface HookRefs {
  state: MutableRefObject<ParamsState>;
  setSearchParams: MutableRefObject<SetURLSearchParams>;
  options: MutableRefObject<UseZodSearchOptions>;
}

export function useZodSearchParams<
  T extends Record<string, AllowedTypes>,
  S extends z.ZodObject<T>,
>(schema: S, options: Partial<UseZodSearchOptions> = DEFAULT_OPTIONS) {
  const [searchParams, setSearchParams] = useSearchParams();

  const parsedOptions: UseZodSearchOptions = { ...DEFAULT_OPTIONS, ...options };

  const stateRef = useRef<ParamsState>({
    source: searchParams,
    latest: searchParams,
  });
  if (stateRef.current.source !== searchParams) {
    stateRef.current = { source: searchParams, latest: searchParams };
  }

  const setSearchParamsRef = useRef(setSearchParams);
  setSearchParamsRef.current = setSearchParams;

  const optionsRef = useRef(parsedOptions);
  optionsRef.current = parsedOptions;

  const refs: HookRefs = {
    state: stateRef,
    setSearchParams: setSearchParamsRef,
    options: optionsRef,
  };

  useEffect(UpdateParamsFactory(schema, refs, searchParams), [searchParams]);

  const params = useMemo(
    ParamsGetterObjectFunctionFactory(schema, parsedOptions, searchParams),
    [searchParams, schema],
  );

  const { setPartial, setters } = useMemo(
    ParamsSetterFactoryFactory(schema, refs),
    [schema],
  );

  return {
    params,
    setters,
    setParams: setPartial,
  };
}

function UpdateParamsFactory<
  T extends Record<string, AllowedTypes>,
  S extends z.ZodObject<T>,
  K extends keyof S["shape"],
>(schema: S, refs: HookRefs, searchParams: URLSearchParams) {
  return () => {
    const options = refs.options.current;
    // Never mutate the router's own instance.
    const newParams = new URLSearchParams(searchParams);
    let hasChanged = false;

    for (const key of Object.keys(schema.shape) as K[]) {
      const value = newParams.get(key as string);

      if (value === null) continue;

      const valueSchema = schema.shape[key];

      try {
        const parsedValue = valueSchema?.parse(
          deserializeValue(valueSchema, value),
        );

        const defaultInfo = findDefault(valueSchema);

        if (
          options.clearDefaults &&
          defaultInfo &&
          parsedValue === defaultInfo.value
        ) {
          hasChanged = true;
          newParams.delete(key as string);
        }
      } catch (error) {
        if (options.onParseError === "throw") {
          throw error;
        }

        hasChanged = true;
        newParams.delete(key as string);
      }
    }

    if (hasChanged) {
      refs.state.current.latest = newParams;
      // Cleaning is a correction, not a navigation: don't create a history
      // entry the user could go "back" into.
      refs.setSearchParams.current(newParams, { replace: true });
    }
  };
}

function ParamsGetterObjectFunctionFactory<
  T extends Record<string, AllowedTypes>,
  S extends z.ZodObject<T>,
  K extends keyof S["shape"],
>(schema: S, options: UseZodSearchOptions, searchParams: URLSearchParams) {
  return () => {
    const obj = {} as z.infer<S>;

    for (const key of Object.keys(schema.shape) as K[]) {
      Object.defineProperty(obj, key, {
        get() {
          const valueSchema = schema.shape[key];
          const fallback = findDefault(valueSchema)?.value ?? null;

          try {
            const searchValue = searchParams.get(key as string);

            if (searchValue) {
              return valueSchema?.parse(
                deserializeValue(valueSchema, searchValue),
              );
            }

            return fallback;
          } catch (error) {
            if (options.onParseError === "throw") {
              throw error;
            }

            return fallback;
          }
        },
        enumerable: true,
      });
    }

    return obj;
  };
}

function ParamsSetterFactoryFactory<
  T extends Record<string, AllowedTypes>,
  S extends z.ZodObject<T>,
  K extends keyof S["shape"],
>(schema: S, refs: HookRefs) {
  return () => {
    function setParamValue(
      key: string & K,
      value: z.infer<S["shape"][K]>,
      params: URLSearchParams,
    ) {
      const options = refs.options.current;

      try {
        const valueSchema = schema.shape[key]!;
        const parsedValue = valueSchema.parse(value);
        const defaultInfo = findDefault(valueSchema);

        const shouldClearValue =
          ["", null].includes(parsedValue as any) ||
          (options.clearDefaults &&
            defaultInfo !== undefined &&
            defaultInfo.value === parsedValue);

        if (shouldClearValue) {
          params.delete(key);
        } else {
          params.set(key, String(parsedValue));
        }
      } catch (error) {
        if (options.onSetValueError === "throw") {
          throw error;
        }
      }
    }

    function commit(update: (params: URLSearchParams) => void) {
      const newParams = new URLSearchParams(refs.state.current.latest);

      update(newParams);

      refs.state.current.latest = newParams;
      refs.setSearchParams.current(newParams);
    }

    function setPartial(data: Partial<z.infer<S>>) {
      commit((newParams) => {
        for (const key in data) {
          //@ts-expect-error Trust me TypeScript
          setParamValue(key, data[key], newParams);
        }
      });
    }

    function getSetter(key: string & K) {
      return (v: z.infer<S["shape"][K]>) => {
        commit((newParams) => setParamValue(key, v, newParams));
      };
    }

    const setters = {} as {
      [Key in K as SetterName<string & Key>]: (
        value: z.infer<S["shape"][Key]>,
      ) => void;
    };

    for (const key of Object.keys(schema.shape) as K[]) {
      //@ts-expect-error Trust me TypeScript
      setters[SetterNameFactory(key)] = getSetter(key);
    }

    return { setPartial, setters };
  };
}

const SetterNameFactory = <T extends string>(str: T) => {
  return [
    "set",
    str[0]!.toUpperCase(),
    str.slice(1).replace(/_([a-z0-9])/g, (g) => g[1]!.toUpperCase()),
  ].join("") as SetterName<T>;
};

interface SchemaDef {
  type?: string;
  innerType?: unknown;
  defaultValue?: unknown;
}

function getDef(schema: unknown): SchemaDef | undefined {
  return (schema as { def?: SchemaDef } | undefined)?.def;
}

/**
 * Finds a `.default()` anywhere in the default/nullable wrapper chain, so both
 * `.nullable().default(x)` and `.default(x).nullable()` are detected.
 */
function findDefault(schema: unknown): { value: unknown } | undefined {
  let def = getDef(schema);

  while (def) {
    if (def.type === "default") return { value: def.defaultValue };
    if (def.type !== "nullable") return undefined;
    def = getDef(def.innerType);
  }

  return undefined;
}

function getBaseType(schema: unknown): string | undefined {
  let def = getDef(schema);

  while (def && (def.type === "default" || def.type === "nullable")) {
    def = getDef(def.innerType);
  }

  return def?.type;
}

/**
 * `z.coerce.boolean()` uses `Boolean(value)`, so the string "false" would be
 * parsed as `true`. Convert the serialized booleans back before parsing.
 */
function deserializeValue(schema: unknown, value: string): unknown {
  if (getBaseType(schema) === "boolean") {
    if (value === "true") return true;
    if (value === "false") return false;
  }

  return value;
}
