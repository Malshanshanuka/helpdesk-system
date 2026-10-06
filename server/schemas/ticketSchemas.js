import { z } from "zod";

const CATEGORIES = ["computer", "network", "account", "email", "software", "other"];
const PRIORITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["open", "in_progress", "resolved", "closed"];

export const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required").max(150, "Title must be 150 characters or fewer"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(CATEGORIES, { message: "Invalid category" }),
  priority: z.enum(PRIORITIES).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(STATUSES, { message: "Invalid status" }),
});

export const assignTicketSchema = z.object({
  assignedTo: z.string().nullable().optional(),
});
