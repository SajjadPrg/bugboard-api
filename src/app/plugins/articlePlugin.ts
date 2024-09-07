import { Hono } from "hono";
import { activateAndJwtMiddleware } from "../middlewares/authMiddleware";
import { zValidator } from "@hono/zod-validator";
import {
  createArticleSchema,
  updateArticleSchema,
  searchArticleSchema,
} from "../schemas/articleSchema";
import db from "../services/db";
import Fuse from "fuse.js";
import { normalizeText } from "../services/normalize";

const article = new Hono();

article.post(
  "/create",
  activateAndJwtMiddleware,
  zValidator("json", createArticleSchema),
  async (c) => {
    const validData = await c.req.valid("json");
    const userId = await c.get("user").userId;
    try {
      const newArticle = await db.article.create({
        data: {
          title: validData.title,
          content: validData.content,
          userId,
        },
      });
      return c.json({
        message: "Article created successfully",
        data: newArticle,
      });
    } catch (error: any) {
      console.log(error.message);
      return c.json({ message: "Internal error" });
    }
  }
);

article.put(
  "/update/:id",
  activateAndJwtMiddleware,
  zValidator("json", updateArticleSchema),
  async (c) => {
    const validData = await c.req.valid("json");
    const articleId = Number(c.req.param("id"));
    const userId = await c.get("user").userId;

    const updateData: { title?: string; content?: string } = {};
    if (validData.title !== undefined) updateData.title = validData.title;
    if (validData.content !== undefined) updateData.content = validData.content;

    if (Object.keys(updateData).length === 0) {
      return c.json({ message: "No update data provided" }, { status: 400 });
    }

    try {
      const existingArticle = await db.article.findFirst({
        where: { id: articleId, userId },
      });

      if (!existingArticle) {
        return c.json(
          { message: "Article not found or not authorized" },
          { status: 404 }
        );
      }

      const updatedArticle = await db.article.update({
        where: { id: articleId },
        data: updateData,
      });

      return c.json({
        message: "Article updated successfully",
        updatedArticle,
      });
    } catch (error: any) {
      console.log(error.message);
      return c.json({ message: "Internal error" });
    }
  }
);

article.delete("/delete/:id", activateAndJwtMiddleware, async (c) => {
  const articleId = Number(c.req.param("id"));
  const userId = await c.get("user").userId;

  try {
    const existingArticle = await db.article.findFirst({
      where: { id: articleId, userId },
    });

    if (!existingArticle) {
      return c.json(
        { message: "Article not found or not authorized" },
        { status: 404 }
      );
    }

    await db.article.delete({
      where: { id: articleId },
    });

    return c.json({ message: "Article deleted successfully" });
  } catch (error: any) {
    console.log(error.message);
    return c.json({ message: "Internal error" });
  }
});

article.get("/my-articles", activateAndJwtMiddleware, async (c) => {
  const userId = await c.get("user").userId;

  try {
    const myArticles = await db.article.findMany({
      where: { userId },
    });

    return c.json({
      message: "My articles retrieved successfully",
      myArticles,
    });
  } catch (error: any) {
    console.log(error.message);
    return c.json({ message: "Internal error" });
  }
});

article.get(
  "/search",
  zValidator("query", searchArticleSchema),
  activateAndJwtMiddleware,
  async (c) => {
    const validQuery = await c.req.valid("query");
    const searchTerm = normalizeText(validQuery.value);

    try {
      const allArticles = await db.article.findMany();

      if (!searchTerm) {
        return c.json({ message: "All articles retrieved", allArticles });
      }

      const options = {
        keys: ["title", "content"],
        threshold: 0.3,
      };

      const fuse = new Fuse(allArticles, options);
      const foundArticles = fuse.search(searchTerm).map((result) => {
        const { id, ...rest } = result.item; // حذف شناسه از مقاله
        return rest;
      });

      return c.json({ message: "Articles found", foundArticles });
    } catch (error: any) {
      console.log(error.message);
      return c.json({ message: "Internal error" });
    }
  }
);

export default article;
