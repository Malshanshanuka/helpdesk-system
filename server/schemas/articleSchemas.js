import { z } from "zod";

export const ARTICLE_CATEGORIES_LIST = [
  "hardware",
  "software",
  "network",
  "account",
  "email",
  "other",
];

export const articleBodySchema = z.object({
  title: z.string().min(1, "Title is required").max(150, "Title must be 150 characters or fewer"),
  summary: z.string().min(1, "Summary is required").max(300, "Summary must be 300 characters or fewer"),
  content: z.string().min(1, "Content is required"),
  category: z.enum(ARTICLE_CATEGORIES_LIST, { message: "Invalid category" }),
  isPublished: z.boolean().optional(),
});

export const updateArticleSchema = articleBodySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" }
);
