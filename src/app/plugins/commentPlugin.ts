import { Hono } from "hono";
import { activateAndJwtMiddleware } from "../middlewares/authMiddleware";
import { zValidator } from "@hono/zod-validator";
import {
  createCommentSchema,
  getCommentSchema,
} from "../schemas/commentSchema";
import db from "../services/db";

const comment = new Hono();

comment.post(
  "/create",
  activateAndJwtMiddleware,
  zValidator("json", createCommentSchema),
  async (c) => {
    const validData = await c.req.valid("json");
    const userId = await c.get("user").userId;

    try {
      // چک کردن وجود مقاله با articleId مشخص
      const article = await db.article.findFirst({
        where: { id: validData.articleId },
      });

      if (!article) {
        return c.json({ message: "Article not found" }, { status: 404 });
      }

      const newComment = await db.comment.create({
        data: {
          content: validData.content,
          articleId: validData.articleId,
          userId,
        },
      });

      return c.json({
        message: "Comment created successfully",
      });
    } catch (error: any) {
      console.log(error.message);
      return c.json({ message: "Internal error" });
    }
  }
);

comment.delete("/delete/:id", activateAndJwtMiddleware, async (c) => {
  const commentId = Number(c.req.param("id"));
  const userId = await c.get("user").userId;

  try {
    const existingComment = await db.comment.findFirst({
      where: { id: commentId, userId },
    });

    if (!existingComment) {
      return c.json(
        { message: "Comment not found or not authorized" },
        { status: 404 }
      );
    }

    await db.comment.delete({
      where: { id: commentId },
    });

    return c.json({ message: "Comment deleted successfully" });
  } catch (error: any) {
    console.log(error.message);
    return c.json({ message: "Internal error" });
  }
});

comment.get(
  "/article/:articleId",
  zValidator("param", getCommentSchema),
  async (c) => {
    const validData = await c.req.valid("param");

    try {
      const comments = await db.comment.findMany({
        where: { articleId: validData.articleId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      return c.json({ message: "Comments retrieved successfully", comments });
    } catch (error: any) {
      console.log(error.message);
      return c.json({ message: "Internal error" });
    }
  }
);

export default comment;
