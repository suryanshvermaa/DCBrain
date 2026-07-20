import { z } from 'zod';

/** Valid Neo4j label: letters/underscore only (allowlist to prevent Cypher label injection). */
const LABEL_PATTERN = /^[A-Za-z_]+$/;

export const GraphQuerySchema = z.object({
  // Neo4j cannot bind a variable-length range as a parameter, so depth is
  // validated + clamped to a small integer before interpolation.
  depth: z.coerce.number().int().min(1).max(5).default(3),
  types: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        val
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .every((t) => LABEL_PATTERN.test(t)),
      { message: 'types must be a comma-separated list of valid labels (letters/underscore only)' }
    )
    .describe('Comma-separated list of labels to include (e.g. Equipment,Vendor)'),
});

export const GraphEntitiesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
});
