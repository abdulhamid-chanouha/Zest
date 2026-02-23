import { randomBytes, randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { sessions, users, type UserPayload } from "@/lib/schema";

export const SESSION_COOKIE_NAME = "zest_session";
const SESSION_DURATION_DAYS = 14;

function getSessionExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);
  return expiresAt;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateToken() {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string) {
  const id = randomUUID();
  const token = generateToken();
  const expiresAt = getSessionExpiry();

  await db.insert(sessions).values({
    id,
    userId,
    token,
    expiresAt: expiresAt.toISOString(),
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function invalidateSession(token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function getCurrentUser(): Promise<UserPayload | null> {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  const now = new Date().toISOString();
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
    .limit(1);

  if (!rows[0]) {
    return null;
  }

  return rows[0];
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

export async function signOutCurrentSession() {
  const token = await getSessionToken();

  if (token) {
    await invalidateSession(token);
  }

  await clearSessionCookie();
}
