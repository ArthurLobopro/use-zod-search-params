import type React from "react";
import z from "zod";
import { GenericUserTable } from "../components/GenericUserTable";

const BasicSchema = z.object({
  page: z.coerce.number().int().default(1),
  page_items: z.coerce.number().int().default(10),
  search: z.string().nullable().default(null),
  role: z.enum(["admin", "editor", "viewer"]).nullable().default(null),
  status: z.enum(["active", "inactive", "pending"]).nullable().default(null),
});

export const BasicPage: React.FC = () => {
  return (
    <GenericUserTable
      schema={BasicSchema}
      options={{ clearDefaults: false, onParseError: "clean" }}
      title="Basic/Default Configuration"
      description="Tests the default behavior of the hook. Invalid params are silently cleaned and defaults are preserved in the URL."
    />
  );
};

export default BasicPage;
