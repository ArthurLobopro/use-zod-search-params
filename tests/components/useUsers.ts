import { useMemo } from "react";
import { USERS_MOCK_DATA } from "../mocks/users";

interface UseUsersParams {
  search?: string | null;
  page: number;
  page_items: number;
  role?: string | null;
  status?: string | null;
}

export function useUsers({
  search,
  page_items,
  page,
  role,
  status,
}: UseUsersParams) {
  const filteredData = useMemo(() => {
    let data = USERS_MOCK_DATA;

    if (search) {
      const lowerTerm = search.toLowerCase();
      data = data.filter(
        (user) =>
          user.name.toLowerCase().includes(lowerTerm) ||
          user.email.toLowerCase().includes(lowerTerm) ||
          user.id.toLowerCase().includes(lowerTerm),
      );
    }

    if (role && role !== "all") {
      data = data.filter(
        (user) => user.role.toLowerCase() === role.toLowerCase(),
      );
    }

    if (status && status !== "all") {
      data = data.filter(
        (user) => user.status.toLowerCase() === status.toLowerCase(),
      );
    }

    return data;
  }, [search, role, status]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / page_items));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * page_items;
  const endIndex = Math.min(startIndex + page_items, totalItems);

  const currentData = filteredData.slice(startIndex, startIndex + page_items);

  return { currentData, endIndex, totalItems, startIndex, totalPages };
}
