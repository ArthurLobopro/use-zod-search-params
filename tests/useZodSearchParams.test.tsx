import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi } from "vitest";
import BasicPage from "./pages/BasicPage";
import ClearDefaultsPage from "./pages/ClearDefaultsPage";
import StrictPage from "./pages/StrictPage";

describe("useZodSearchParams - Integration Tests using Test App Pages", () => {
  test("BasicPage: renders, parses parameters, performs search and handles pagination", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <BasicPage />
      </MemoryRouter>,
    );

    // Assert initial stats
    expect(screen.getByTestId("results-summary")).toHaveTextContent(
      "Showing 1 - 10 of 100 results",
    );
    expect(screen.getByTestId("page-indicator")).toHaveTextContent(
      "Page 1 of 10",
    );

    // Check URL query indicator initially matches basic defaults
    expect(screen.getByText(/URL Query:/).nextSibling).toHaveTextContent(
      "?(empty)",
    );

    // Check next page pagination (needs to be done while unfiltered so we have multiple pages)
    const nextBtn = screen.getByTestId("next-page-btn");
    fireEvent.click(nextBtn);
    expect(screen.getByTestId("page-indicator")).toHaveTextContent(
      "Page 2 of 10",
    );

    // Type into search input
    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "Emma" } });

    // Expect lists/totals to update
    await waitFor(() => {
      expect(screen.getByTestId("results-summary")).toHaveTextContent(
        /Showing 1 - \d+ of \d+ results/,
      );
      expect(screen.getByTestId("page-indicator")).toHaveTextContent(
        "Page 1 of 1",
      );
    });

    // Click Reset
    const resetBtn = screen.getByTestId("reset-params-btn");
    fireEvent.click(resetBtn);
    await waitFor(() => {
      expect(screen.getByTestId("page-indicator")).toHaveTextContent(
        "Page 1 of 10",
      );
    });
  });

  test("ClearDefaultsPage: strips defaults from URL but preserves custom values", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ClearDefaultsPage />
      </MemoryRouter>,
    );

    // On load, since defaults are cleared and we are at default values, the URL query should be empty
    expect(screen.getByText(/URL Query:/).nextSibling).toHaveTextContent(
      "?(empty)",
    );

    // Modify a value to a non-default (e.g. go to page 2)
    const nextBtn = screen.getByTestId("next-page-btn");
    fireEvent.click(nextBtn);

    // URL should now contain page=2
    await waitFor(() => {
      expect(screen.getByText(/URL Query:/).nextSibling).toHaveTextContent(
        "page=2",
      );
    });

    // Go back to page 1 (default)
    const prevBtn = screen.getByTestId("prev-page-btn");
    fireEvent.click(prevBtn);

    // URL should become empty again because page=1 is a default
    await waitFor(() => {
      expect(screen.getByText(/URL Query:/).nextSibling).toHaveTextContent(
        "?(empty)",
      );
    });
  });

  test("StrictPage: throws parse error on invalid param types and recovers", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const errorHandler = (event: ErrorEvent) => {
      if (
        event.error?.name === "ZodError" ||
        event.message?.includes("concurrent rendering")
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener("error", errorHandler);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <StrictPage />
      </MemoryRouter>,
    );

    // The component initially renders fine
    expect(screen.queryByTestId("error-title")).not.toBeInTheDocument();

    // Click "Corrupt URL" button to inject invalid page value: "invalid-number-xyz"
    const corruptBtn = screen.getByTestId("corrupt-url-btn");
    fireEvent.click(corruptBtn);

    // Expect local error boundary to catch the thrown error and render fallback
    await waitFor(() => {
      expect(screen.getByTestId("error-title")).toHaveTextContent(
        "Zod Parse Error Thrown",
      );
    });

    // Reset parameters to recover
    const errorResetBtn = screen.getByTestId("error-reset-btn");
    fireEvent.click(errorResetBtn);

    // Expect recovery to normal table state
    await waitFor(() => {
      expect(screen.queryByTestId("error-title")).not.toBeInTheDocument();
      expect(screen.getByTestId("page-indicator")).toHaveTextContent(
        "Page 1 of 10",
      );
    });

    window.removeEventListener("error", errorHandler);
    consoleSpy.mockRestore();
  });

  test("BasicPage: validates and applies enum filter inputs", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <BasicPage />
      </MemoryRouter>,
    );

    // Check that filters are rendered (now part of BasicPage)
    const roleFilter = screen.getByTestId("role-filter");
    const statusFilter = screen.getByTestId("status-filter");
    expect(roleFilter).toBeInTheDocument();
    expect(statusFilter).toBeInTheDocument();

    // Select "Admin" role
    fireEvent.change(roleFilter, { target: { value: "admin" } });

    // URL should update to role=admin
    await waitFor(() => {
      expect(screen.getByText(/URL Query:/).nextSibling).toHaveTextContent(
        "role=admin",
      );
    });

    // Select "Active" status
    fireEvent.change(statusFilter, { target: { value: "active" } });

    // URL should now update with both params
    await waitFor(() => {
      const urlQuery = screen.getByText(/URL Query:/).nextSibling?.textContent;
      expect(urlQuery).toContain("role=admin");
      expect(urlQuery).toContain("status=active");
    });
  });
});
