import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { CustomContext } from "../services/context";
import db from "../services/db";

export const jwtMiddleware = async (c: CustomContext, next: Next) => {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return c.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = await verify(token, Bun.env.AUTH_TOKEN || "secret-key");
    c.set("user", decoded);
    await next();
  } catch (error) {
    return c.json({ message: "Invalid token" }, { status: 401 });
  }
};

export const activateAndJwtMiddleware = async (
  c: CustomContext,
  next: Next
) => {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return c.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = await verify(token, Bun.env.AUTH_TOKEN || "secret-key");
    const user = await db.user.findUnique({
      where: { id: Number(decoded.userId) },
    });
    if (!user || !user.active) {
      return c.json({ message: "Account not activate" }, { status: 401 });
    }
    c.set("user", decoded);
    await next();
  } catch (error) {
    return c.json({ message: "Invalid token" }, { status: 401 });
  }
};
