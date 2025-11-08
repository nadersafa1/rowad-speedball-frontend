import { z } from "zod";

// Query parameters for GET /results
export const resultsQuerySchema = z
  .object({
    playerId: z.uuid("Invalid player ID format").optional(),
    testId: z.uuid("Invalid test ID format").optional(),
    q: z
      .string()
      .trim()
      .max(50, "q must be less than 50 characters")
      .optional(),
    gender: z.enum(["male", "female", "all"]).optional(),
    ageGroup: z
      .enum([
        "mini",
        "U-09",
        "U-11",
        "U-13",
        "U-15",
        "U-17",
        "U-19",
        "U-21",
        "Seniors",
        "all",
      ])
      .optional(),
    yearOfBirth: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine(
        (val) => val === undefined || (val >= 1900 && val <= 2100),
        "Year of birth must be between 1900 and 2100"
      ),
    minScore: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine(
        (val) => val === undefined || val >= 0,
        "Minimum score must be non-negative"
      ),
    maxScore: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine(
        (val) => val === undefined || val >= 0,
        "Maximum score must be non-negative"
      ),
    dateFrom: z
      .string()
      .optional()
      .refine(
        (date) => !date || !isNaN(Date.parse(date)),
        "Invalid date format for dateFrom"
      ),
    dateTo: z
      .string()
      .optional()
      .refine(
        (date) => !date || !isNaN(Date.parse(date)),
        "Invalid date format for dateTo"
      ),
    // Sorting parameters
    sortBy: z
      .enum([
        "totalScore",
        "leftHandScore",
        "rightHandScore",
        "forehandScore",
        "backhandScore",
        "playerName",
        "ageGroup",
        "age",
        "createdAt",
      ])
      .optional(),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    // Pagination parameters
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val >= 1, "Page must be greater than 0"),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 25))
      .refine(
        (val) => val >= 1 && val <= 100,
        "Limit must be between 1 and 100"
      ),
  })
  .strict()
  .refine((data) => {
    if (data.minScore !== undefined && data.maxScore !== undefined) {
      return data.minScore <= data.maxScore;
    }
    return true;
  }, "Minimum score must be less than or equal to maximum score");

// Route parameters for GET /results/:id
export const resultsParamsSchema = z.object({
  id: z.uuid("Invalid result ID format"),
});

// Create result schema for POST /results
export const resultsCreateSchema = z
  .object({
    playerId: z.uuid("Invalid player ID format"),
    testId: z.uuid("Invalid test ID format"),
    leftHandScore: z
      .number()
      .int("Left hand score must be an integer")
      .min(0, "Left hand score cannot be negative")
      .max(999, "Left hand score cannot exceed 999"),
    rightHandScore: z
      .number()
      .int("Right hand score must be an integer")
      .min(0, "Right hand score cannot be negative")
      .max(999, "Right hand score cannot exceed 999"),
    forehandScore: z
      .number()
      .int("Forehand score must be an integer")
      .min(0, "Forehand score cannot be negative")
      .max(999, "Forehand score cannot exceed 999"),
    backhandScore: z
      .number()
      .int("Backhand score must be an integer")
      .min(0, "Backhand score cannot be negative")
      .max(999, "Backhand score cannot exceed 999"),
  })
  .strict();

// Update result schema for PATCH /results/:id
export const resultsUpdateSchema = z
  .object({
    leftHandScore: z
      .number()
      .int("Left hand score must be an integer")
      .min(0, "Left hand score cannot be negative")
      .max(999, "Left hand score cannot exceed 999")
      .optional(),
    rightHandScore: z
      .number()
      .int("Right hand score must be an integer")
      .min(0, "Right hand score cannot be negative")
      .max(999, "Right hand score cannot exceed 999")
      .optional(),
    forehandScore: z
      .number()
      .int("Forehand score must be an integer")
      .min(0, "Forehand score cannot be negative")
      .max(999, "Forehand score cannot exceed 999")
      .optional(),
    backhandScore: z
      .number()
      .int("Backhand score must be an integer")
      .min(0, "Backhand score cannot be negative")
      .max(999, "Backhand score cannot exceed 999")
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided for update"
  )
  .strict();

// Bulk create results schema for POST /results/bulk
export const resultsBulkCreateSchema = z
  .object({
    results: z
      .array(resultsCreateSchema)
      .min(1, "At least one result must be provided")
      .max(50, "Cannot create more than 50 results at once"),
  })
  .strict();

// Inferred TypeScript types
export type ResultsQuery = z.infer<typeof resultsQuerySchema>;
export type ResultsParams = z.infer<typeof resultsParamsSchema>;
export type ResultsCreate = z.infer<typeof resultsCreateSchema>;
export type ResultsUpdate = z.infer<typeof resultsUpdateSchema>;
export type ResultsBulkCreate = z.infer<typeof resultsBulkCreateSchema>;

