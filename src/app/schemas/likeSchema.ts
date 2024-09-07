import { z } from "zod";

export const likeSchema = z.object({
  articleId: z.number().optional(),
  solutionId: z.number().optional(),
});
