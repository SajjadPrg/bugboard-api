import { Context } from "hono";

// Define a custom context type
export interface CustomContext extends Context {
  user?: {
    id: number;
    username: string;
    email: string;
    isActive: boolean;
  };
}
