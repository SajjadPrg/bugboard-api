import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().regex(/^[a-zA-Z0-9]+$/),
  email: z.string().email(),
  password: z
    .string()
    .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/),
});

export const activateSchema = z.object({
  token: z.string(),
});

export const loginSchema = z.object({
  identifier: z.string(),
  password: z.string(),
});

export const updateSchema = z.object({
  username: z
    .string()
    .regex(/^[a-zA-Z0-9]+$/)
    .optional(),
  password: z
    .string()
    .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/)
    .optional(),
});

export const getForgotCode = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  code: z.number(),
  email: z.string().email(),
  password: z
    .string()
    .regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/),
});
