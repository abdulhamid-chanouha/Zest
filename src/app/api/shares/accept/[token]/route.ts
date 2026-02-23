import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { forbidden, notFound, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/recipe-helpers";
import { recipeShares } from "@/lib/schema";

export async function POST(
  _request: Request,
  context: {
    params: Promise<{ token: string }>;
  },
) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const params = await context.params;

  const share = await db.query.recipeShares.findFirst({
    where: (table, { and: andFn, eq: eqFn, isNull: isNullFn }) =>
      andFn(eqFn(table.shareToken, params.token), isNullFn(table.revokedAt)),
  });

  if (!share) {
    return notFound("Share not found.");
  }

  if (share.sharedWithUserId && share.sharedWithUserId !== user.id) {
    return forbidden("This share is bound to a different account.");
  }

  if (share.sharedWithEmail && normalizeEmail(share.sharedWithEmail) !== user.email) {
    return forbidden("This share is intended for a different email.");
  }

  const existingAccess = await db.query.recipeShares.findFirst({
    where: (table, { and: andFn, eq: eqFn, isNull: isNullFn }) =>
      andFn(eqFn(table.recipeId, share.recipeId), eqFn(table.sharedWithUserId, user.id), isNullFn(table.revokedAt)),
  });

  if (existingAccess && existingAccess.id !== share.id) {
    return NextResponse.json({
      ok: true,
      recipeId: existingAccess.recipeId,
      alreadyAccepted: true,
    });
  }

  const updated = await db
    .update(recipeShares)
    .set({
      sharedWithUserId: user.id,
      sharedWithEmail: user.email,
    })
    .where(and(eq(recipeShares.id, share.id), isNull(recipeShares.revokedAt)))
    .returning({
      id: recipeShares.id,
      recipeId: recipeShares.recipeId,
      shareToken: recipeShares.shareToken,
    });

  return NextResponse.json({
    ok: true,
    share: updated[0],
  });
}
