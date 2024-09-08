import { z } from "zod";

export const dislikeSchema = z.object({
  articleId: z.number().optional(),
  solutionId: z.number().optional(),
});
