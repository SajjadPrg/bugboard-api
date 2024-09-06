import { z } from "zod";

export const createBugSchema = z.object({
  code: z.string(),
  description: z.string().min(5),
});

export const searchBugSchema = z.object({
  value: z.string(),
});

export const updateBugSchema = z.object({
  code: z.string().optional(),
  description: z.string().min(5).optional(),
});
