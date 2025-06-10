import type { Context, Next } from "hono";
import { getDefaultClient } from "@focuspilot/db";

export interface AuthContext {
  userId: string;
  user: any;
}

declare module "hono" {
  interface ContextVariableMap {
    auth: AuthContext;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized - No token provided" }, 401);
    }

    const token = authHeader.substring(7);
    const supabase = getDefaultClient();

    // Verify the JWT token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized - Invalid token" }, 401);
    }

    // Set auth context
    c.set("auth", {
      userId: user.id,
      user,
    });

    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
}

export function getAuthContext(c: Context): AuthContext {
  const auth = c.get("auth");
  if (!auth) {
    throw new Error(
      "Auth context not found. Make sure auth middleware is applied."
    );
  }
  return auth;
}
