import { z } from "zod";

const ROLES = ["employee", "it_support", "admin"];

export const updateRoleSchema = z.object({
  role: z.enum(ROLES, { message: "Invalid role" }),
});

export const updateStatusSchema = z.object({
  isActive: z.boolean({ message: "isActive must be true or false" }),
});
