import { Hono } from "hono";
import { activateAndJwtMiddleware } from "../middlewares/authMiddleware";
import { zValidator } from "@hono/zod-validator";
import { likeSchema } from "../schemas/likeSchema";
import db from "../services/db";

const like = new Hono();

like.post(
  "",
  activateAndJwtMiddleware,
  zValidator("json", likeSchema),
  async (c) => {
    const validData = await c.req.valid("json");
    const userId = await c.get("user").userId;

    if (!validData.articleId && !validData.solutionId) {
      return c.json(
        { message: "Either articleId or solutionId must be provided" },
        { status: 400 }
      );
    }

    if (validData.articleId && validData.solutionId) {
      return c.json(
        {
          message:
            "You cannot like both an article and a solution at the same time",
        },
        { status: 400 }
      );
    }

    try {
      const existingLike = await db.like.findFirst({
        where: {
          userId,
          articleId: validData.articleId,
          solutionId: validData.solutionId,
        },
      });

      if (existingLike) {
        return c.json(
          { message: "You have already liked this item" },
          { status: 400 }
        );
      }

      // ایجاد لایک جدید
      const newLike = await db.like.create({
        data: {
          userId,
          articleId: validData.articleId,
          solutionId: validData.solutionId,
        },
      });

      return c.json({
        message: "Like created successfully",
        data: newLike,
      });
    } catch (error: any) {
      console.log(error.message);
      return c.json({ message: "Internal error" });
    }
  }
);
like.delete(
  "",
  activateAndJwtMiddleware,
  zValidator("json", likeSchema),
  async (c) => {
    const validData = await c.req.valid("json");
    const userId = await c.get("user").userId;

    if (!validData.articleId && !validData.solutionId) {
      return c.json(
        { message: "Either articleId or solutionId must be provided" },
        { status: 400 }
      );
    }

    if (validData.articleId && validData.solutionId) {
      return c.json(
        {
          message:
            "You cannot like both an article and a solution at the same time",
        },
        { status: 400 }
      );
    }

    try {
      const existingLike = await db.like.findFirst({
        where: {
          userId,
          articleId: validData.articleId,
          solutionId: validData.solutionId,
        },
      });

      if (!existingLike) {
        return c.json({ message: "Like not found" }, { status: 404 });
      }

      await db.like.delete({
        where: { id: existingLike.id },
      });

      return c.json({ message: "Like deleted successfully" });
    } catch (error: any) {
      console.log(error.message);
      return c.json({ message: "Internal error" });
    }
  }
);

export default like;
