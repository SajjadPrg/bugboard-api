import { zValidator } from "@hono/zod-validator";
import { Context, Hono } from "hono";
import {
  activateSchema,
  getForgotCode,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateSchema,
} from "../schemas/authSchema";
import db from "../services/db";
import { sign, verify } from "hono/jwt";
import {
  sendActiveUserEmail,
  sendPasswordResetCodeEmail,
} from "../services/email";
import {
  activateAndJwtMiddleware,
  jwtMiddleware,
} from "../middlewares/authMiddleware";

const auth = new Hono();

auth.post("/register", zValidator("json", registerSchema), async (c) => {
  const validData = await c.req.valid("json");
  try {
    const userExist = await db.user.findFirst({
      where: {
        OR: [{ email: validData.email }, { username: validData.username }],
      },
    });
    if (userExist) {
      return c.json(
        { message: "User already exists with this email or username" },
        { status: 400 }
      );
    }
    const passHash = await Bun.password.hash(validData.password);
    const user = await db.user.create({
      data: {
        username: validData.username,
        email: validData.email,
        password: passHash,
      },
    });
    const token = await sign(
      { userId: user.id, email: user.email, username: user.username },
      Bun.env.AUTH_TOKEN || "secret-key"
    );
    const activeEmailToken = await sign(
      { userId: user.id },
      Bun.env.AUTH_TOKEN_Activation || "secret-key-email"
    );
    setImmediate(() =>
      sendActiveUserEmail(user.email, activeEmailToken).catch(console.error)
    );
    const { id, password, ...otherData } = user;
    return c.json(
      {
        message:
          "User registered successfully - We send for u active link to your email",
        token,
        user: otherData,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.log(error.message);
    return c.json({ message: "Internal error" }, { status: 500 });
  }
});

auth.get("/activation", zValidator("query", activateSchema), async (c) => {
  const validQuery = await c.req.valid("query");
  try {
    const decoded = await verify(
      validQuery.token,
      Bun.env.AUTH_TOKEN_Activation || "secret-key-email"
    );
    if (!decoded || typeof decoded.userId !== "number") {
      return c.json({ message: "invalid token" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: decoded.userId } });
    if (user?.active) {
      return c.json(
        { message: "Your account already activate" },
        { status: 400 }
      );
    }
    await db.user.update({
      where: { id: decoded.userId },
      data: {
        active: true,
      },
    });
    return c.json(
      { message: "Your account activated successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.log(error.message);
    return c.json({ message: "Internal error" }, { status: 500 });
  }
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const validData = await c.req.valid("json");
  try {
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: validData.identifier },
          { username: validData.identifier },
        ],
      },
    });
    if (!user) {
      return c.json(
        { message: "Identifier or password incorrect" },
        { status: 400 }
      );
    }
    const passCheck = await Bun.password.verify(
      validData.password,
      user.password
    );
    if (!passCheck) {
      return c.json(
        { message: "Identifier or password incorrect" },
        { status: 400 }
      );
    }
    const token = await sign(
      { userId: user.id, email: user.email, username: user.username },
      Bun.env.AUTH_TOKEN || "secret-key"
    );
    const { id, password, ...otherData } = user;
    return c.json({
      message: "Registered successfully",
      token,
      user: otherData,
    });
  } catch (error: any) {
    console.log(error.message);
    return c.json({ message: "Internal error" }, { status: 500 });
  }
});

auth.get("/resend-activation", jwtMiddleware, async (c) => {
  const userId = c.get("user").userId; // Get the user from the context

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return c.json({ message: "User not found" }, { status: 400 });
    }

    if (user.active) {
      return c.json({ message: "User is already active" }, { status: 400 });
    }

    const activeEmailToken = await sign(
      { userId: user.id },
      Bun.env.AUTH_TOKEN_Activation || "secret-key-email"
    );

    setImmediate(() =>
      sendActiveUserEmail(user.email, activeEmailToken).catch(console.error)
    );

    return c.json({ message: "Activation link sent" }, { status: 200 });
  } catch (error: any) {
    console.log(error.message);
    return c.json({ message: "Internal error" }, { status: 500 });
  }
});

auth.put(
  "/update",
  jwtMiddleware,
  zValidator("json", updateSchema),
  async (c) => {
    const validData = await c.req.valid("json");
    const userId = c.get("user").userId;

    try {
      if (!validData.username && !validData.password) {
        return c.json({ message: "Your form is empty" }, { status: 400 });
      }
      const data: any = {};
      if (validData.username) {
        const usernameExist = await db.user.findUnique({
          where: { username: validData.username },
        });
        if (usernameExist) {
          return c.json(
            { message: "This username already exists" },
            { status: 400 }
          );
        }
        data.username = validData.username;
      }
      if (validData.password)
        data.password = await Bun.password.hash(validData.password);

      const user = await db.user.update({
        where: { id: userId },
        data,
      });

      const { password: pass, ...otherData } = user;
      return c.json(
        { message: "User updated successfully", user: otherData },
        { status: 200 }
      );
    } catch (error: any) {
      console.log(error.message);
      return c.json({ message: "Internal error" }, { status: 500 });
    }
  }
);

auth.delete("/delete", jwtMiddleware, async (c) => {
  const userId = c.get("user").userId;

  try {
    await db.user.delete({ where: { id: userId } });
    return c.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.log(error.message);
    return c.json({ message: "Internal error" }, { status: 500 });
  }
});

auth.post(
  "/forgot-password-code",
  zValidator("json", getForgotCode),
  async (c) => {
    const validData = await c.req.valid("json");
    try {
      const user = await db.user.findUnique({
        where: { email: validData.email },
      });
      if (user) {
        const code = Math.round(Math.random() * (99999 - 10000) + 10000);
        await db.user.update({
          where: { email: validData.email },
          data: {
            forgottenCode: code,
          },
        });
        setImmediate(() =>
          sendPasswordResetCodeEmail(user.email, code).catch(console.error)
        );
      }
      return c.json(
        {
          message:
            "If there is an account with this email, we have sent the recovery code to it",
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.log(error.message);
      return c.json({ message: "Internal error" }, { status: 500 });
    }
  }
);

auth.post(
  "/reset-password",
  zValidator("json", resetPasswordSchema),
  async (c) => {
    const validData = await c.req.valid("json");
    try {
      const user = await db.user.findUnique({
        where: { email: validData.email },
      });
      if (!user) {
        return c.json(
          { message: "email or code is not correct" },
          { status: 400 }
        );
      }
      const hashPass = await Bun.password.hash(validData.password);
      if (user.forgottenCode == validData.code) {
        await db.user.update({
          where: { email: validData.email },
          data: {
            password: hashPass,
            forgottenCode: null,
          },
        });
        return c.json(
          { message: "Password changed successfully" },
          { status: 201 }
        );
      }
      return c.json(
        { message: "email or code is not correct" },
        { status: 400 }
      );
    } catch (error: any) {
      console.log(error.message);
      return c.json({ message: "Internal error" }, { status: 500 });
    }
  }
);

auth.get("/validate-token", jwtMiddleware, (c) => {
  try {
    return c.json({ message: "Token is valid" }, { status: 200 });
  } catch (error: any) {
    console.log(error.message);
    return c.json({ message: "Internal error" }, { status: 500 });
  }
});

export default auth;
