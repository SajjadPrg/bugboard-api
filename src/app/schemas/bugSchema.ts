import { z } from "zod";

export const createBugSchema = z.object({
  code: z.string(),
  description: z.string().min(5),
});
