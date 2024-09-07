import { string, z } from "zod";

export const addSolutionSchema = z.object({
  content: string().min(5),
  code: string().optional(),
});
