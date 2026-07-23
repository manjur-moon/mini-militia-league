import { z } from "zod";
import { DEFAULT_PAGINATION } from "../constants/app.constants.js";

const positiveIntegerFromQuery = (fallback) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => (value === undefined ? fallback : Number(value)))
    .pipe(z.number().int().positive());

export const paginationQuerySchema = z.object({
  page: positiveIntegerFromQuery(DEFAULT_PAGINATION.PAGE),
  limit: positiveIntegerFromQuery(DEFAULT_PAGINATION.LIMIT).pipe(
    z.number().max(DEFAULT_PAGINATION.MAX_LIMIT),
  ),
});

export function createPaginationMeta({ page, limit, totalItems }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
