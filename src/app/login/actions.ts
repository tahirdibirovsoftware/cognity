"use server";

import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { normalizeEmail, verifyUserPassword } from "@/lib/auth-helpers";
import { createSession } from "@/lib/session";

export type LoginState = { error?: string };

const DEMO_ACCOUNTS: Record<string, { email: string; password: string }> = {
  manager: { email: "manager@cognity.demo", password: "demo1234" },
  employee: { email: "employee@cognity.demo", password: "demo1234" },
};

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const demo = formData.get("demo");
  const demoAccount = typeof demo === "string" ? DEMO_ACCOUNTS[demo] : undefined;

  const parsed = credentialsSchema.safeParse(
    demoAccount ?? {
      email: normalizeEmail(String(formData.get("email") ?? "")),
      password: String(formData.get("password") ?? ""),
    },
  );

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const db = getDb();
  const user = await db.query.users.findFirst({
    where: sql`lower(${users.email}) = ${parsed.data.email}`,
  });

  if (!user) {
    return { error: "Invalid email or password." };
  }

  const isPasswordValid = await verifyUserPassword(
    parsed.data.password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    return { error: "Invalid email or password." };
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
  });

  redirect(user.role === "MANAGER" ? "/manager" : "/employee");
}
