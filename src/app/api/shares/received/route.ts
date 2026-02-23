import { and, desc, eq, isNull, or } from "drizzle-orm";
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
      recipeId: recipes.id,
      recipeName: recipes.name,
      cuisine: recipes.cuisine,
      status: recipes.status,
      prepTimeMinutes: recipes.prepTimeMinutes,
      tagsJson: recipes.tagsJson,
      sharedByName: users.fullName,
      sharedByEmail: users.email,
      shareToken: recipeShares.shareToken,
      createdAt: recipeShares.createdAt,
    })
    .from(recipeShares)
    .innerJoin(recipes, eq(recipeShares.recipeId, recipes.id))
    .innerJoin(users, eq(recipeShares.sharedBy, users.id))
    .where(
      and(
        isNull(recipeShares.revokedAt),
        or(eq(recipeShares.sharedWithUserId, user.id), eq(recipeShares.sharedWithEmail, user.email)),
      ),
    )
    .orderBy(desc(recipeShares.createdAt));

  const shares = rows.map((row) => ({
    ...row,
    tags: row.tagsJson ? (JSON.parse(row.tagsJson) as string[]) : [],
  }));

  return NextResponse.json({ shares });
}
