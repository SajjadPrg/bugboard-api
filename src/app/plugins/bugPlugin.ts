import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createBugSchema } from "../schemas/bugSchema";
import { activateAndJwtMiddleware } from "../middlewares/authMiddleware";
import db from "../services/db";

const bug = new Hono();

bug.post(
  "/create",
  zValidator("json", createBugSchema),
  activateAndJwtMiddleware,
  async (c) => {
    const validData = await c.req.valid("json");
    const userId = c.get("user").userId;
    try {
      const newBug = await db.bug.create({
        data: {
          code: validData.code,
          description: validData.description,
          userId,
        },
      });
      return c.json(
        { message: "Bug created successfully", newBug },
        { status: 201 }
      );
    } catch (error: any) {
      console.log(error.message);
      return c.json({ message: "Internal error" });
    }
  }
);

export default bug;
