import { NextResponse } from "next/server";

import { badRequest, unauthorized } from "@/lib/api";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/recipe-helpers";
import { signInSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signInSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Invalid sign in payload.", parsed.error.issues);
  }

  const email = normalizeEmail(parsed.data.email);

  const user = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.email, email),
  });

  if (!user) {
    return unauthorized("Invalid email or password.");
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!valid) {
    return unauthorized("Invalid email or password.");
  }

  const session = await createSession(user.id);
  await setSessionCookie(session.token, session.expiresAt);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    },
  });
}
