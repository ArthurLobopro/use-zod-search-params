import { useEffect, useMemo } from "react";
import { type SetURLSearchParams, useSearchParams } from "react-router-dom";
import type { ZodDefault, z } from "zod";
import type { AllowedTypes, SetterName, UseZodSearchOptions } from "./types";

const DEFAULT_OPTIONS = {
  onParseError: "clean",
  clearDefaults: false,
} satisfies UseZodSearchOptions;

export function useZodSearchParams<
  T extends Record<string, AllowedTypes>,
  S extends z.ZodObject<T>,
  K extends keyof S["shape"],
>(schema: S, options: UseZodSearchOptions = DEFAULT_OPTIONS) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(
    UpdateParamsFactory(schema, options, searchParams, setSearchParams),
    [searchParams],
  );

  const params = useMemo(
    ParamsGetterObjectFunctionFactory(schema, options, searchParams),
    [searchParams, schema],
  );

  function setPartial(data: Partial<z.infer<S>>) {
    const params = new URLSearchParams(searchParams);

    for (const key in data) {
      //@ts-expect-error Trust me TypeScript
      const parsedValue = schema.shape[key].parse(data[key]);

      if (parsedValue) {
        params.set(key, String(parsedValue));
      } else {
        params.delete(key);
      }
    }

    setSearchParams(params);
  }

  function getSetter<K extends keyof S["shape"]>(key: K) {
    return (v: z.infer<S["shape"][K]>) =>
      setPartial({ [key]: v } as Partial<z.infer<S>>);
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
>(
  schema: S,
  options: UseZodSearchOptions,
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
) {
  return () => {
    let hasChanged = false;

    for (const key of Object.keys(schema.shape) as K[]) {
      try {
        schema.shape[key]?.parse(searchParams.get(key as string));
      } catch (error) {
        if (options.onParseError === "throw") {
          throw error;
        }

        hasChanged = true;
        searchParams.delete(key as string);
      }
    }

    if (hasChanged) {
      setSearchParams(searchParams);
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

          try {
            const hasValue = searchParams.has(key as string);
            const searchValue = searchParams.get(key as string);

            if (hasValue && searchValue) {
              return schema.shape[key]?.parse(searchValue);
            }

            return isDefault(valueSchema) ? valueSchema.def.defaultValue : null;
          } catch (error) {
            if (options.onParseError === "throw") {
              throw error;
            }

            return isDefault(valueSchema) ? valueSchema.def.defaultValue : null;
          }
        },
        enumerable: true,
      });
    }

    return obj;
  };
}

const SetterNameFactory = <T extends string>(str: T) => {
  return [
    "set",
    str[0]!.toUpperCase(),
    str.slice(1).replace(/_([a-z0-9])/g, (g) => g[1]!.toUpperCase()),
  ].join("") as SetterName<T>;
};

// biome-ignore lint/suspicious/noExplicitAny: v must be any because it's a type guard function
function isDefault(v: any): v is ZodDefault {
  return (v as ZodDefault)?.def?.defaultValue !== undefined;
}
