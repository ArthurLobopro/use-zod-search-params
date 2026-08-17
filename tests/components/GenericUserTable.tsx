import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Search,
} from "lucide-react";
import React from "react";
import { useSearchParams } from "react-router";
import type { z } from "zod";
import { useZodSearchParams } from "../../src/index";
import type { UseZodSearchOptions } from "../../src/types";
import { cn, formatDate } from "../lib/utils";
import { UserRole, UserStatus } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { useUsers } from "./useUsers";

// Simple Error Boundary Fallback for testing onParseError: "throw"
class LocalErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback: (error: Error, reset: () => void) => React.ReactNode;
    onReset: () => void;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("LocalErrorBoundary caught an error", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error, this.handleReset);
    }
    return this.props.children;
  }
}

interface GenericUserTableProps {
  schema: z.ZodObject<any>;
  options?: Partial<UseZodSearchOptions>;
  title: string;
  description: string;
}

// Inner component that actually uses the hook
const TableInner: React.FC<
  GenericUserTableProps & {
    searchParams: URLSearchParams;
    setSearchParams: any;
  }
> = ({
  schema,
  options,
  title,
  description,
  searchParams,
  setSearchParams,
}) => {
  const { params, setters, setParams } = useZodSearchParams(schema, options);

  // Safely extract params with defaults in case of missing keys
  const page = Number((params as any).page ?? 1);
  const page_items = Number((params as any).page_items ?? 10);
  const search = (params as any).search ?? "";
  const role = (params as any).role ?? "all";
  const status = (params as any).status ?? "all";

  // Use individual setters if available, fallback to setParams
  const setPage =
    (setters as any).setPage ||
    ((val: number) => setParams({ page: val } as any));
  const setPageItems =
    (setters as any).setPageItems ||
    ((val: number) => setParams({ page_items: val } as any));

  const { currentData, endIndex, totalItems, startIndex, totalPages } =
    useUsers({
      search,
      page_items,
      page,
      role,
      status,
    });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setParams({
      page: 1,
      search: term || null,
    } as any);
  };

  const handlePageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageItems = Number(e.currentTarget.value);
    if (newPageItems > page_items) {
      setParams({
        page: 1,
        page_items: newPageItems,
      } as any);
      return;
    }
    setPageItems(newPageItems);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setParams({
      page: 1,
      role: e.target.value === "all" ? null : e.target.value,
    } as any);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setParams({
      page: 1,
      status: e.target.value === "all" ? null : e.target.value,
    } as any);
  };

  const handleClear = () => {
    const resetObj: Record<string, any> = {};
    for (const key of Object.keys(schema.shape)) {
      const fieldSchema = schema.shape[key];
      if (
        fieldSchema &&
        "_def" in fieldSchema &&
        "defaultValue" in fieldSchema._def
      ) {
        const defVal = fieldSchema._def.defaultValue;
        resetObj[key] = typeof defVal === "function" ? defVal() : defVal;
      } else {
        resetObj[key] = null;
      }
    }
    setParams(resetObj as any);
  };

  // Inject some bad parameters to test the parser behavior
  const handleCorruptURL = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", "invalid-number-xyz");
    newParams.set("page_items", "99999");
    newParams.set("role", "INVALID_ROLE");
    setSearchParams(newParams);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header controls & stats */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between gap-4 text-xs font-mono text-slate-600 rounded-t-xl">
        <div className="space-y-1">
          <div>
            <strong className="text-slate-800">Title:</strong> {title}
          </div>
          <div className="font-sans text-slate-500 my-1">{description}</div>
          <div>
            <strong className="text-slate-800">Options:</strong>{" "}
            {JSON.stringify(options)}
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <strong className="text-slate-800">URL Query:</strong>
            <code
              className="bg-slate-200 px-1.5 py-0.5 rounded text-rose-600 max-w-xs truncate"
              title={searchParams.toString()}
            >
              ?{searchParams.toString() || "(empty)"}
            </code>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCorruptURL}
              className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-sans font-medium transition"
              data-testid="corrupt-url-btn"
            >
              Corrupt URL
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded font-sans font-medium transition"
              data-testid="reset-params-btn"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 pt-0 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 flex-col md:flex-row gap-2 w-full">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filter users..."
                value={search}
                onChange={handleSearch}
                className="pl-9"
                data-testid="search-input"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                className="h-9 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 px-2"
                value={role}
                onChange={handleRoleChange}
                data-testid="role-filter"
              >
                <option value="all">All Roles</option>
                {Object.values(UserRole).map((r) => (
                  <option key={r} value={r.toLowerCase()}>
                    {r}
                  </option>
                ))}
              </select>

              <select
                className="h-9 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 px-2"
                value={status}
                onChange={handleStatusChange}
                data-testid="status-filter"
              >
                <option value="all">All Statuses</option>
                {Object.values(UserStatus).map((s) => (
                  <option key={s} value={s.toLowerCase()}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className="text-sm text-slate-500 whitespace-nowrap"
            data-testid="results-summary"
          >
            Showing {totalItems > 0 ? startIndex + 1 : 0} - {endIndex} of{" "}
            {totalItems} results
          </div>
        </div>

        {/* Table representation */}
        <div className="rounded-md border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.length > 0 ? (
                currentData.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">
                          {user.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          ID: {user.id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-600">{user.email}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ring-black/5",
                          user.role === UserRole.ADMIN
                            ? "bg-purple-100 text-purple-700"
                            : user.role === UserRole.EDITOR
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700",
                        )}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex h-2 w-2 rounded-full",
                            user.status === UserStatus.ACTIVE
                              ? "bg-emerald-500"
                              : user.status === UserStatus.PENDING
                                ? "bg-amber-500"
                                : "bg-rose-500",
                          )}
                        />
                        <span className="text-slate-700 capitalize">
                          {user.status.toLowerCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-500 whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-slate-500"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-sm text-slate-500" data-testid="page-indicator">
            Page {page} of {totalPages}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-500">Rows per page</span>
              <select
                className="h-8 w-16 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 px-2"
                value={page_items}
                onChange={handlePageChange}
                data-testid="page-items-select"
              >
                {[10, 20, 30, 40, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                data-testid="first-page-btn"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                data-testid="prev-page-btn"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                data-testid="next-page-btn"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                data-testid="last-page-btn"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GenericUserTable: React.FC<GenericUserTableProps> = (props) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleResetURL = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <LocalErrorBoundary
      onReset={handleResetURL}
      fallback={(error, reset) => (
        <div className="p-6 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
          <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-2 max-w-md">
            <h3
              className="text-lg font-semibold text-slate-900"
              data-testid="error-title"
            >
              Zod Parse Error Thrown
            </h3>
            <p
              className="text-sm text-slate-500 font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 text-left overflow-x-auto max-h-40"
              data-testid="error-message"
            >
              {error.message || String(error)}
            </p>
          </div>
          <Button
            onClick={reset}
            className="mt-2"
            data-testid="error-reset-btn"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset URL Params
          </Button>
        </div>
      )}
    >
      <TableInner
        {...props}
        searchParams={searchParams}
        setSearchParams={setSearchParams}
      />
    </LocalErrorBoundary>
  );
};
