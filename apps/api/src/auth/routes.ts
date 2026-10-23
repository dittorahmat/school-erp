import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";
import { Bindings } from "../index";
import { hashPassword, verifyPassword, signJwt } from "./crypto";
import { authMiddleware } from "./middleware";
import { createDb, users, eq } from "@school-erp/db";


const authRouter = new Hono<{ Bindings: Bindings }>();

const loginInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginInputSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid username or password format" }, 400);
  }

  const { username, password } = parsed.data;
  const db = createDb(c.env.DB);

  const foundUsers = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const user = foundUsers[0];

  if (!user) {
    // Demo seed users fallback saat database D1 kosong
    const demoAccounts: Record<string, { pass: string; role: any; name: string }> = {
      admin: { pass: "admin123", role: "admin", name: "Hj. Siti Aminah, S.Pd. (Admin TU)" },
      guru_budi: { pass: "guru123", role: "teacher", name: "Budi Purnomo, S.Pd. (Guru)" },
      siswa_ahmad: { pass: "siswa123", role: "student", name: "Ahmad Dahlan (Siswa)" },
      wali_subagyo: { pass: "wali123", role: "guardian", name: "Ir. Bambang Subagyo (Wali)" },
    };

    const demoUser = demoAccounts[username];
    if (demoUser && password === demoUser.pass) {
      const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 hours
      const payload = {
        sub: `usr_demo_${username}`,
        username,
        fullName: demoUser.name,
        role: demoUser.role,
        exp,
      };
      const token = await signJwt(payload, c.env.JWT_SECRET);

      setCookie(c, "access_token", token, {
        httpOnly: true,
        secure: c.env.ENVIRONMENT === "production",
        sameSite: "Lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      });

      return c.json({
        user: {
          id: payload.sub,
          username: payload.username,
          fullName: payload.fullName,
          role: payload.role,
        },
        token,
      });
    }

    return c.json({ error: "Username atau password salah" }, 401);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return c.json({ error: "Username atau password salah" }, 401);
  }

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  const payload = {
    sub: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    exp,
  };
  const token = await signJwt(payload, c.env.JWT_SECRET);

  setCookie(c, "access_token", token, {
    httpOnly: true,
    secure: c.env.ENVIRONMENT === "production",
    sameSite: "Lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return c.json({
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
    token,
  });
});

authRouter.post("/logout", (c) => {
  deleteCookie(c, "access_token", { path: "/" });
  return c.json({ message: "Berhasil logout" });
});

authRouter.get("/me", authMiddleware(), (c) => {
  const user = c.get("user");
  return c.json({ user });
});

export { authRouter };
