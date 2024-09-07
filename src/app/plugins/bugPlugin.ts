import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  createBugSchema,
  searchBugSchema,
  updateBugSchema,
} from "../schemas/bugSchema";
import { activateAndJwtMiddleware } from "../middlewares/authMiddleware";
import {
  detectLanguage,
  normalizeEnglishText,
  normalizePersianText,
} from "../services/normalize";
import Fuse from "fuse.js";
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

bug.get("/myBugs", activateAndJwtMiddleware, async (c) => {
  const userId = c.get("user").userId;
  try {
    const myBugs = await db.bug.findMany({ where: { userId } });
    return c.json({ message: "Bug found", myBugs });
  } catch (error: any) {
    console.log(error.message);
    return c.json({ message: "Internal error" });
  }
});

bug.get(
  "/search",
  zValidator("query", searchBugSchema),
  activateAndJwtMiddleware,
  async (c) => {
    const validQuery = await c.req.valid("query");
    const searchTerm = validQuery.value.toLowerCase();
    const language = detectLanguage(searchTerm);

    try {
      const allBugs = await db.bug.findMany();

      // نرمال‌سازی توضیحات باگ‌ها بر اساس زبان
      const normalizedResults = allBugs.map((bug) => ({
        ...bug,
        description:
          language === "persian"
            ? normalizePersianText(bug.description.toLowerCase())
            : normalizeEnglishText(bug.description.toLowerCase()),
      }));

      // نرمال‌سازی کوئری بر اساس زبان
      const normalizedSearchTerm =
        language === "persian"
          ? normalizePersianText(searchTerm)
          : normalizeEnglishText(searchTerm);

      // تنظیمات fuse.js
      const options = {
        keys: ["description"],
        threshold: 0.3, // مقدار این پارامتر تعیین می‌کند که چقدر جستجو دقیق باشد. مقدار کمتر = تطبیق دقیق‌تر.
      };

      const fuse = new Fuse(normalizedResults, options);
      const foundBugs = fuse.search(normalizedSearchTerm).map((result) => {
        const { id, ...bugWithoutId } = result.item;
        return bugWithoutId;
      });

      return c.json({ message: "Bugs found", foundBugs });
    } catch (error: any) {
      console.log(error.message);
      return c.json({ message: "Internal error" });
    }
  }
);

bug.put(
  "/update/:id",
  zValidator("json", updateBugSchema),
  activateAndJwtMiddleware,
  async (c) => {
    const validData = await c.req.valid("json");
    const bugId = Number(c.req.param("id"));
    const userId = c.get("user").userId;

    // ساخت یک آبجکت برای فیلدهای بروزرسانی
    const updateData: { code?: string; description?: string } = {};
    if (validData.code !== undefined) updateData.code = validData.code;
    if (validData.description !== undefined)
      updateData.description = validData.description;

    // چک کردن اینکه هیچ دیتایی برای بروزرسانی ارسال نشده است
    if (Object.keys(updateData).length === 0) {
      return c.json({ message: "No update data provided" }, { status: 400 });
    }

    try {
      // بررسی وجود باگ با bugId و userId
      const existingBug = await db.bug.findFirst({
        where: { id: bugId, userId },
      });

      if (!existingBug) {
        return c.json(
          { message: "Bug not found or not authorized" },
          { status: 404 }
        );
      }

      // بروزرسانی باگ
      const updatedBug = await db.bug.update({
        where: { id: bugId },
        data: updateData,
      });

      return c.json({ message: "Bug updated successfully", updatedBug });
    } catch (error: any) {
      console.log(error.message);
      return c.json({ message: "Internal error" });
    }
  }
);

bug.delete("/delete/:id", activateAndJwtMiddleware, async (c) => {
  const bugId = Number(c.req.param("id"));
  const userId = c.get("user").userId;

  try {
    const deletedBug = await db.bug.deleteMany({
      where: { id: bugId, userId },
    });

    if (deletedBug.count === 0) {
      return c.json(
        { message: "Bug not found or not authorized" },
        { status: 404 }
      );
    }

    return c.json({ message: "Bug deleted successfully" });
  } catch (error: any) {
    console.log(error.message);
    return c.json({ message: "Internal error" });
  }
});

export default bug;
