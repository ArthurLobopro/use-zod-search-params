import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";
import type React from "react";
import z from "zod";
import { useZodSearchParams } from "../../src/index";
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

const UserListParams = z.object({
  page: z.coerce.number().int().default(1),
  page_items: z.coerce.number().int().default(10),
  search: z.string().nullable().default(null),
});

const UserTable: React.FC = () => {
  const {
    params: { search, page, page_items },
    setters: { setPage, setPageItems },
    setParams,
  } = useZodSearchParams(UserListParams);

  const { currentData, endIndex, totalItems, startIndex, totalPages } =
    useUsers({ search, page_items, page });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setParams({
      page: 1,
      search: term ?? null,
    });
  };

  const handlePageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageItems = Number(e.currentTarget.value);
    if (newPageItems > page_items) {
      setParams({
        page: 1,
        page_items: newPageItems,
      });
      return;
    }

    setPageItems(newPageItems);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 border-b border-slate-100">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Filter users..."
            value={search ?? ""}
            onChange={handleSearch}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-slate-500">
          Showing {totalItems > 0 ? startIndex + 1 : 0} - {endIndex} of{" "}
          {totalItems} results
        </div>
      </div>

      <div className="w-full">
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
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">
                        {user.name}
                      </span>
                      <span className="text-xs text-slate-500 hidden sm:inline-block">
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
                <TableCell colSpan={5} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 gap-4">
        <div className="flex-1 text-sm text-slate-500">
          Page {page} of {totalPages}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-500">Rows per page</span>
            <select
              className="h-8 w-16 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 px-2"
              value={page_items}
              onChange={handlePageChange}
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
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTable;
