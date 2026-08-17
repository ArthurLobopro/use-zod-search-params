import type React from "react";
import z from "zod";
import { GenericUserTable } from "../components/GenericUserTable";

const ClearDefaultsSchema = z.object({
  page: z.coerce.number().int().default(1),
  page_items: z.coerce.number().int().default(10),
  search: z.string().nullable().default(null),
  role: z.enum(["admin", "editor", "viewer"]).nullable().default(null),
  status: z.enum(["active", "inactive", "pending"]).nullable().default(null),
});

export const ClearDefaultsPage: React.FC = () => {
  return (
    <GenericUserTable
      schema={ClearDefaultsSchema}
      options={{ clearDefaults: true, onParseError: "clean" }}
      title="Clear Defaults Configuration"
      description="Tests the clearDefaults option. Parameters holding default values (like page=1 or page_items=10) are stripped from the URL query string."
    />
  );
};

export default ClearDefaultsPage;
