import { z } from "zod";

export const createArticleSchema = z.object({
  title: z.string().min(5),
  content: z.string().min(10),
  draft: z.boolean().optional(), // افزودن فیلد draft به اسکیمای ایجاد مقاله
});

export const updateArticleSchema = z.object({
  title: z.string().min(5).optional(),
  content: z.string().min(10).optional(),
});

export const searchArticleSchema = z.object({
  value: z.string().min(1),
});
