import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { badRequest, conflict } from "@/lib/api";
import { createSession, hashPassword, setSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/recipe-helpers";
import { users } from "@/lib/schema";
import { signUpSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signUpSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Invalid sign up payload.", parsed.error.issues);
  }

  const fullName = parsed.data.fullName.trim();
  const email = normalizeEmail(parsed.data.email);

  const existing = await db.query.users.findFirst({
    where: (table, { eq: eqFn }) => eqFn(table.email, email),
  });

  if (existing) {
    return conflict("An account with this email already exists.");
  }

  const userId = randomUUID();
  const passwordHash = await hashPassword(parsed.data.password);

  await db.insert(users).values({
    id: userId,
    email,
    fullName,
    passwordHash,
  });

  const session = await createSession(userId);
  await setSessionCookie(session.token, session.expiresAt);

  return NextResponse.json({
    user: {
      id: userId,
      email,
      fullName,
    },
  });
}
