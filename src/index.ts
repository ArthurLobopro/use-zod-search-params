import { useEffect, useMemo } from "react";
import { type SetURLSearchParams, useSearchParams } from "react-router-dom";
import type { ZodDefault, z } from "zod";
import type { AllowedTypes, SetterName, UseZodSearchOptions } from "./types";

const DEFAULT_OPTIONS = {
  onParseError: "clean",
  onSetValueError: "throw",
  clearDefaults: false,
} satisfies UseZodSearchOptions;

export function useZodSearchParams<
  T extends Record<string, AllowedTypes>,
  S extends z.ZodObject<T>,
>(schema: S, options: Partial<UseZodSearchOptions> = DEFAULT_OPTIONS) {
  const [searchParams, setSearchParams] = useSearchParams();

  const parsedOptions: UseZodSearchOptions = { ...DEFAULT_OPTIONS, ...options };

  useEffect(
    UpdateParamsFactory(schema, parsedOptions, searchParams, setSearchParams),
    [searchParams],
  );

  const params = useMemo(
    ParamsGetterObjectFunctionFactory(schema, parsedOptions, searchParams),
    [searchParams, schema],
  );

  const { setPartial, setters } = useMemo(
    ParamsSetterFactoryFactory(
      schema,
      parsedOptions,
      searchParams,
      setSearchParams,
    ),
    [schema, searchParams],
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
>(
  schema: S,
  options: UseZodSearchOptions,
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams,
) {
  return () => {
    let hasChanged = false;

    for (const key of Object.keys(schema.shape) as K[]) {
      const hasValue = searchParams.has(key as string);

      if (!hasValue) continue;

      const value = searchParams.get(key as string);

      try {
        const parsedValue = schema.shape[key]?.parse(value);

        if (
          isDefault(schema.shape[key]) &&
          parsedValue === schema.shape[key]?.def.defaultValue &&
          options.clearDefaults
        ) {
          hasChanged = true;
          searchParams.delete(key as string);
        }
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

function ParamsSetterFactoryFactory<
  T extends Record<string, AllowedTypes>,
  S extends z.ZodObject<T>,
  K extends keyof S["shape"],
>(
  schema: S,
  options: UseZodSearchOptions,
  params: URLSearchParams,
  setParams: SetURLSearchParams,
) {
  return () => {
    function setParamValue(
      key: string & K,
      value: z.infer<S["shape"][K]>,
      params: URLSearchParams,
    ) {
      try {
        const parsedValue = schema.shape[key]!.parse(value);

        if (
          options.clearDefaults &&
          isDefault(schema.shape[key]) &&
          getDefaultValue(schema.shape[key]) === parsedValue
        ) {
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

    function setPartial(data: Partial<z.infer<S>>) {
      const newParams = new URLSearchParams(params);

      for (const key in data) {
        //@ts-expect-error Trust me TypeScript
        setParamValue(key, data[key], newParams);
      }

      setParams(newParams);
    }

    function getSetter(key: string & K) {
      return (v: z.infer<S["shape"][K]>) => {
        const newParams = new URLSearchParams(params);

        setParamValue(key, v, newParams);
        setParams(newParams);
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

// biome-ignore lint/suspicious/noExplicitAny: v must be any because it's a type guard function
function isDefault(v: any): v is ZodDefault {
  return (v as ZodDefault)?.def?.defaultValue !== undefined;
}

function getDefaultValue<T extends ZodDefault>(schema: T) {
  return schema.def.defaultValue as T extends ZodDefault<infer U>
    ? z.infer<U>
    : never;
}
