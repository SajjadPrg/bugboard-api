import { Hono } from "hono";
import { activateAndJwtMiddleware } from "../middlewares/authMiddleware";
import { zValidator } from "@hono/zod-validator";
import { addSolutionSchema } from "../schemas/solutionSchema";
import db from "../services/db";

const solution = new Hono();

solution.post(
  "/add/:id",
  activateAndJwtMiddleware,
  zValidator("json", addSolutionSchema),
  async (c) => {
    const bugId = await Number(c.req.param("id"));
    const userId = await c.get("user").userId;
    const validData = await c.req.valid("json");
    try {
      const newSolution = await db.solution.create({
        data: {
          content: validData.content,
          code: validData.code,
          userId,
          bugId,
        },
      });

      return c.json({
        message: "solution created successfully",
        solution: newSolution,
      });
    } catch (error: any) {
      console.log(error.message);
      return c.json({ message: "Internal error" });
    }
  }
);

solution.get("/bugSolution/:id", activateAndJwtMiddleware, async (c) => {
  const bugId = await Number(c.req.param("id"));
  try {
    const bugTarget = await db.bug.findUnique({
      where: { id: bugId },
      include: { solutions: true },
    });
    if (!bugTarget) {
      return c.json({ message: "Bug with this id not found" }, { status: 404 });
    }
    return c.json({
      message: "solutions found successfully",
      solution: bugTarget.solutions,
    });
  } catch (error: any) {
    console.log(error.message);
    return c.json({ message: "Internal error" });
  }
});

export default solution;
