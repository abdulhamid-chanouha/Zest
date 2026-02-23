import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { notFound, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { recipeShares } from "@/lib/schema";

export async function PATCH(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const params = await context.params;

  const updated = await db
    .update(recipeShares)
    .set({ revokedAt: new Date().toISOString() })
    .where(
      and(
        eq(recipeShares.id, params.id),
        eq(recipeShares.sharedBy, user.id),
        isNull(recipeShares.revokedAt),
      ),
    )
    .returning({ id: recipeShares.id });

  if (!updated[0]) {
    return notFound("Share not found.");
  }

  return NextResponse.json({ ok: true });
}
