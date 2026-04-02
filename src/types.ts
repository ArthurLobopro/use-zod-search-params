import type z from "zod";

export type BaseAllowedTypes =
  | z.ZodString
  | z.ZodCoercedNumber
  | z.ZodCoercedBoolean
  | z.ZodEnum;

export type MiddleTypes =
  | z.ZodDefault<BaseAllowedTypes>
  | z.ZodNullable<BaseAllowedTypes>;

// Allow to Agregate .nullable().default()
export type AllowedTypes =
  | MiddleTypes
  | z.ZodDefault<MiddleTypes>
  | z.ZodNullable<MiddleTypes>;

export type SnakeToCamel<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Head}${Capitalize<SnakeToCamel<Tail>>}`
    : S;

export type SetterName<T extends string> = `set${Capitalize<SnakeToCamel<T>>}`;

export interface UseZodSearchOptions {
  onParseError: "throw" | "clean";
  onSetValueError: "throw" | "ignore";
  clearDefaults?: boolean;
}
