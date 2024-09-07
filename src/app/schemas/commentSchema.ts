import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1, "Content is required"),
  articleId: z.number(),
});

export const getCommentSchema = z.object({
  articleId: z.number(),
});
