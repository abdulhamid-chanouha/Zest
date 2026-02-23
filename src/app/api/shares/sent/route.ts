import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { recipeShares, recipes, users } from "@/lib/schema";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const rows = await db
    .select({
      id: recipeShares.id,
      recipeId: recipeShares.recipeId,
      recipeName: recipes.name,
      sharedWithEmail: recipeShares.sharedWithEmail,
      sharedWithUserId: recipeShares.sharedWithUserId,
      recipientName: users.fullName,
      shareToken: recipeShares.shareToken,
      revokedAt: recipeShares.revokedAt,
      createdAt: recipeShares.createdAt,
    })
    .from(recipeShares)
    .leftJoin(users, eq(recipeShares.sharedWithUserId, users.id))
    .innerJoin(recipes, eq(recipeShares.recipeId, recipes.id))
    .where(eq(recipeShares.sharedBy, user.id))
    .orderBy(desc(recipeShares.createdAt));

  return NextResponse.json({ shares: rows });
}
