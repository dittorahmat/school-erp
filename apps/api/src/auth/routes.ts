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

  let user = null;
  try {
    const foundUsers = await db.select().from(users).where(eq(users.username, username)).limit(1);
    user = foundUsers[0];
  } catch {
    // Fallback gracefully
  }

  if (!user) {
    // Bootstrap-only fallback: it may only answer while the database has no admin
    // row at all, i.e. before the first seed. On any populated deployment an
    // unknown username must fail closed instead of accepting a code-defined account.
    let hasAdmin = false;
    try {
      const admins = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "admin"))
        .limit(1);
      hasAdmin = admins.length > 0;
    } catch {
      hasAdmin = true;
    }
    if (hasAdmin) {
      return c.json({ error: "Username atau password salah" }, 401);
    }

    // Bootstrap accounts for a freshly migrated, unseeded database
    const demoAccounts: Record<
      string,
      { pass: string; role: "admin" | "teacher" | "student" | "guardian"; name: string }
    > = {
      admin: { pass: "admin123", role: "admin", name: "Hj. Siti Aminah, S.Pd., M.M. (Admin TU)" },
      guru_budi: { pass: "guru123", role: "teacher", name: "Budi Purnomo, S.Pd. (Guru Wali Kelas)" },
      guru_siti: { pass: "guru123", role: "teacher", name: "Siti Rahmawati, M.Pd. (Guru Bahasa)" },
      siswa_ahmad: { pass: "siswa123", role: "student", name: "Ahmad Dahlan (Siswa X-MIPA-1)" },
      siswa_dewi: { pass: "siswa123", role: "student", name: "Dewi Sartika (Siswa X-MIPA-2)" },
      siswa_budi: { pass: "siswa123", role: "student", name: "Budi Santoso (Siswa X-MIPA-1)" },
      wali_subagyo: { pass: "wali123", role: "guardian", name: "Ir. Bambang Subagyo (Wali Ahmad & Dewi)" },
      wali_hartono: { pass: "wali123", role: "guardian", name: "Drs. H. Hartono (Wali Budi Santoso)" },
    };

    const demoUser = demoAccounts[username];
    if (demoUser && password === demoUser.pass) {
      const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
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
