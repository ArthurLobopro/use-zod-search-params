import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  createMemoryRouter,
  RouterProvider,
  useRouteError,
} from "react-router-dom";
import type { z } from "zod";
import { useZodSearchParams } from "../src";
import type { AllowedTypes, UseZodSearchOptions } from "../src/types";

type Router = ReturnType<typeof createMemoryRouter>;

/**
 * Renders `useZodSearchParams` inside an in-memory data router starting at
 * `url`, exposing the router so tests can inspect the location and history.
 */
export function renderSearchParams<
  T extends Record<string, AllowedTypes>,
  S extends z.ZodObject<T>,
>(
  schema: S,
  url = "/",
  options?: Partial<UseZodSearchOptions>,
  /** Runs on every render, before effects (e.g. before invalid params are cleaned). */
  onRender?: (result: ReturnType<typeof useZodSearchParams<T, S>>) => void,
) {
  let router: Router | undefined;
  let routeError: unknown;

  function ErrorElement() {
    routeError = useRouteError();
    return null;
  }

  const hook = renderHook(
    () => {
      const result = useZodSearchParams<T, S>(schema, options);
      onRender?.(result);
      return result;
    },
    {
      wrapper: ({ children }: { children: ReactNode }) => {
        router ??= createMemoryRouter(
          [{ path: "/", element: children, errorElement: <ErrorElement /> }],
          { initialEntries: [url] },
        );
        return <RouterProvider router={router} />;
      },
    },
  );

  const getRouter = () => router!;

  return {
    hook,
    get current() {
      return hook.result.current;
    },
    /** Error thrown while rendering the route, caught by its errorElement. */
    get routeError() {
      return routeError;
    },
    get search() {
      return getRouter().state.location.search;
    },
    get historyAction() {
      return getRouter().state.historyAction;
    },
    async navigate(to: string) {
      await act(async () => {
        await getRouter().navigate(to);
      });
    },
    /** Lets pending effects and router navigations settle. */
    async flush() {
      await act(async () => {});
    },
  };
}

export { act };
