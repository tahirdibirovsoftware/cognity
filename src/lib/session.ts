import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, type Role } from "@/db/schema";

export const SESSION_COOKIE = "cognity_session";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.id !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "MANAGER" && payload.role !== "EMPLOYEE")
    ) {
      return null;
    }

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      department:
        typeof payload.department === "string" ? payload.department : null,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");

  const db = getDb();
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!dbUser) {
    const fallbackUser = await db.query.users.findFirst({
      where: eq(users.email, user.email),
    });
    if (fallbackUser) {
      const refreshed: SessionUser = {
        id: fallbackUser.id,
        name: fallbackUser.name,
        email: fallbackUser.email,
        role: fallbackUser.role,
        department: fallbackUser.department,
      };
      await createSession(refreshed);
      return refreshed;
    }
    await destroySession();
    redirect("/login");
  }

  return user;
}

export async function requireManager(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "MANAGER") redirect("/employee");
  return user;
}

export async function requireEmployee(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "EMPLOYEE") redirect("/manager");
  return user;
}
