import { useMemo } from "react";
import { USERS_MOCK_DATA } from "../mocks/users";

interface UseUsersParams {
  search: string | null;
  page: number;
  page_items: number;
}

export function useUsers({ search, page_items, page }: UseUsersParams) {
  const filteredData = useMemo(() => {
    if (!search) return USERS_MOCK_DATA;

    const lowerTerm = search.toLowerCase();
    return USERS_MOCK_DATA.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerTerm) ||
        user.email.toLowerCase().includes(lowerTerm) ||
        user.id.toLowerCase().includes(lowerTerm),
    );
  }, [search]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / page_items));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * page_items;
  const endIndex = Math.min(startIndex + page_items, totalItems);

  const currentData = filteredData.slice(startIndex, startIndex + page_items);

  return { currentData, endIndex, totalItems, startIndex, totalPages };
}
