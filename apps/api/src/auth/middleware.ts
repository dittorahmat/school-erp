import { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { verifyJwt, AuthUserPayload } from "./crypto";
import { Bindings } from "../index";

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUserPayload;
  }
}

export function authMiddleware(): MiddlewareHandler<{ Bindings: Bindings }> {
  return async (c, next) => {
    const authHeader = c.req.header("Authorization");
    const cookieToken = getCookie(c, "access_token");
    let token = cookieToken;

    if (!token && authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return c.json({ error: "Unauthorized: No token provided" }, 401);
    }

    const payload = await verifyJwt(token, c.env.JWT_SECRET);
    if (!payload) {
      return c.json({ error: "Unauthorized: Invalid or expired token" }, 401);
    }

    c.set("user", payload);
    await next();
  };
}

export function requireRoles(...allowedRoles: string[]): MiddlewareHandler<{ Bindings: Bindings }> {
  return async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: "Forbidden: Insufficient role permissions" }, 403);
    }

    await next();
  };
}
