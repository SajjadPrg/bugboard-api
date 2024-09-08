import { Hono } from "hono";
import { activateAndJwtMiddleware } from "../middlewares/authMiddleware";
import { zValidator } from "@hono/zod-validator";

import db from "../services/db";
import { dislikeSchema } from "../schemas/dislikeSchema";

const dislike = new Hono();

dislike.post(
  "",
  activateAndJwtMiddleware,
  zValidator("json", dislikeSchema),
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
            "You cannot dislike both an article and a solution at the same time",
        },
        { status: 400 }
      );
    }

    try {
      const existingDislike = await db.dislike.findFirst({
        where: {
          userId,
          articleId: validData.articleId,
          solutionId: validData.solutionId,
        },
      });

      const existingLike = await db.like.findFirst({
        where: {
          userId,
          articleId: validData.articleId,
          solutionId: validData.solutionId,
        },
      });

      if (existingDislike) {
        return c.json(
          { message: "You have already disliked this item" },
          { status: 400 }
        );
      }

      if (existingLike) {
        return c.json(
          { message: "You have already liked this item" },
          { status: 400 }
        );
      }

      // ایجاد دیسلایک جدید
      const newDislike = await db.dislike.create({
        data: {
          userId,
          articleId: validData.articleId,
          solutionId: validData.solutionId,
        },
      });

      return c.json({
        message: "Dislike created successfully",
        data: newDislike,
      });
    } catch (error: any) {
      console.log(error.message);
      return c.json({ message: "Internal error" });
    }
  }
);

dislike.delete(
  "",
  activateAndJwtMiddleware,
  zValidator("json", dislikeSchema),
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
            "You cannot dislike both an article and a solution at the same time",
        },
        { status: 400 }
      );
    }

    try {
      const existingDislike = await db.dislike.findFirst({
        where: {
          userId,
          articleId: validData.articleId,
          solutionId: validData.solutionId,
        },
      });

      if (!existingDislike) {
        return c.json({ message: "Dislike not found" }, { status: 404 });
      }

      await db.dislike.delete({
        where: { id: existingDislike.id },
      });

      return c.json({ message: "Dislike deleted successfully" });
    } catch (error: any) {
      console.log(error.message);
      return c.json({ message: "Internal error" });
    }
  }
);

export default dislike;
