import { useSearchParams } from "react-router-dom";
import z from "zod";

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

type SnakeToCamel<S extends string> = S extends `${infer Head}_${infer Tail}` ? `${Head}${Capitalize<SnakeToCamel<Tail>>}` : S;
type SetterName<T extends string> = `set${Capitalize<SnakeToCamel<T>>}`;

const setterName = <T extends string>(str: T) => {
  return `set${str[0]!.toUpperCase()}${str.slice(1).replace(/_([a-z0-9])/g, (g) => g[1]!.toUpperCase())}` as SetterName<T>;
};

export function useZodSearchParams<
  T extends Record<string, AllowedTypes>,
  S extends z.ZodObject<T>,
  K extends keyof S["shape"],
>(schema: S) {
  const [searchParams, setSearchParams] = useSearchParams();

  function setPartial(data: Partial<z.infer<S>>) {
    setSearchParams(
      parseValuesToString({
        ...toObject(searchParams),
        ...data,
      }),
    );
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

  return {
    params: schema.parse(toObject(searchParams)),
    setters,
    setParams: setPartial,
  };
}

const toObject = (search: URLSearchParams) =>
  Object.fromEntries(
    Array.from(search.entries()).filter(([_key, value]) => !!value),
  );

function parseValuesToString(
  obj: Record<string, { toString(): string; }>,
) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_key, value]) => !!value).map(([key, value]) => [key, value.toString()]),
  );
}
