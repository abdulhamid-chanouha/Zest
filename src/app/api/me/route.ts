import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { badRequest, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { updateProfileSchema } from "@/lib/validators";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Invalid profile payload.", parsed.error.issues);
  }

  const updates = await db
    .update(users)
    .set({
      fullName: parsed.data.fullName,
    })
    .where(eq(users.id, user.id))
    .returning({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
    });

  return NextResponse.json({ user: updates[0] });
}
