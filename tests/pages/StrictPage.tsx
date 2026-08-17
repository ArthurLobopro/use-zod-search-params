import type React from "react";
import z from "zod";
import { GenericUserTable } from "../components/GenericUserTable";

const StrictSchema = z.object({
  page: z.coerce.number().int().default(1),
  page_items: z.coerce.number().int().default(10),
  search: z.string().nullable().default(null),
  role: z.enum(["admin", "editor", "viewer"]).nullable().default(null),
  status: z.enum(["active", "inactive", "pending"]).nullable().default(null),
});

export const StrictPage: React.FC = () => {
  return (
    <GenericUserTable
      schema={StrictSchema}
      options={{ clearDefaults: false, onParseError: "throw" }}
      title="Strict (Throw Parse Error) Configuration"
      description="Tests the onParseError: 'throw' option. Loading corrupt parameters causes the hook to throw, triggering the local error boundary fallback."
    />
  );
};

export default StrictPage;
