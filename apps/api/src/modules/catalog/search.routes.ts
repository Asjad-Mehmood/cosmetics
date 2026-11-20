import { searchSuggestSchema } from "@store/validation";
import { ok } from "../../lib/http";
import { defineRoutes, route } from "../../lib/route";
import { suggest } from "./search";

export const searchRouter = defineRoutes("/search", "Catalog", [
  route({
    method: "get",
    path: "/suggest",
    summary: "Search-as-you-type suggestions: up to 6 products and 3 categories",
    description:
      "Typo-tolerant (e.g. `serm` finds serums). Full results: GET /products?q=…&sort=relevance.",
    access: "public",
    query: searchSuggestSchema,
    handler: async ({ query }) => ok(await suggest(query.q)),
  }),
]);
