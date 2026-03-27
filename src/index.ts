import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { ZodDefault, z } from "zod";

type BaseAllowedTypes =
  | z.ZodString
  | z.ZodCoercedNumber
  | z.ZodCoercedBoolean
  | z.ZodEnum;

type MiddleTypes =
  | z.ZodDefault<BaseAllowedTypes>
  | z.ZodNullable<BaseAllowedTypes>;

// Allow to Agregate .nullable().default()
type AllowedTypes =
  | MiddleTypes
  | z.ZodDefault<MiddleTypes>
  | z.ZodNullable<MiddleTypes>;

type SnakeToCamel<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<SnakeToCamel<Tail>>}`
  : S;
type SetterName<T extends string> = `set${Capitalize<SnakeToCamel<T>>}`;

const setterName = <T extends string>(str: T) => {
  return [
    "set",
    str[0]!.toUpperCase(),
    str.slice(1).replace(/_([a-z0-9])/g, (g) => g[1]!.toUpperCase()),
  ].join("") as SetterName<T>;
};

interface UseZodSearchOptions {
  onParseError: "throw" | "clean";
}

const DEFAULT_OPTIONS = {
  onParseError: "clean",
} satisfies UseZodSearchOptions;

export function useZodSearchParams<
  T extends Record<string, AllowedTypes>,
  S extends z.ZodObject<T>,
  K extends keyof S["shape"],
>(schema: S, options: UseZodSearchOptions = DEFAULT_OPTIONS) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
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
  }, [searchParams]);

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
    setters[setterName(key)] = getSetter(key);
  }

  const params = useMemo(() => {
    const obj = {} as z.infer<S>;

    for (const key of Object.keys(schema.shape) as K[]) {
      Object.defineProperty(obj, key, {
        get() {
          try {
            const hasValue = searchParams.has(key as string);
            const searchValue = searchParams.get(key as string);

            if (hasValue && searchValue) {
              return schema.shape[key]?.parse(searchValue);
            }

            return (schema.shape[key] as ZodDefault)?.def?.defaultValue ?? null;
          } catch (error) {
            if (options.onParseError === "throw") {
              throw error;
            }

            return (schema.shape[key] as ZodDefault)?.def?.defaultValue ?? null;
          }
        },
        enumerable: true,
      });
    }

    return obj;
  }, [searchParams, schema]);

  console.log(params);

  return {
    params,
    setters,
    setParams: setPartial,
  };
}
