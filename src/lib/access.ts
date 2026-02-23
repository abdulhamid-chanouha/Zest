import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { recipeShares, type RecipePayload, type UserPayload } from "@/lib/schema";
import { serializeRecipe } from "@/lib/recipe-helpers";

export type RecipeAccess = {
  recipe: RecipePayload;
  isOwner: boolean;
  shareId: string | null;
};

export async function getRecipeAccess(user: UserPayload, recipeId: string): Promise<RecipeAccess | null> {
  const ownRecipe = await db.query.recipes.findFirst({
    where: (table, { and: andFn, eq: eqFn }) => andFn(eqFn(table.id, recipeId), eqFn(table.ownerId, user.id)),
  });

  if (ownRecipe) {
    return {
      recipe: serializeRecipe(ownRecipe),
      isOwner: true,
      shareId: null,
    };
  }

  const share = await db.query.recipeShares.findFirst({
    where: (table, { and: andFn, eq: eqFn, isNull: isNullFn, or: orFn }) =>
      andFn(
        eqFn(table.recipeId, recipeId),
        isNullFn(table.revokedAt),
        orFn(eqFn(table.sharedWithUserId, user.id), eqFn(table.sharedWithEmail, user.email)),
      ),
  });

  if (!share) {
    return null;
  }

  const sharedRecipe = await db.query.recipes.findFirst({
    where: (table, { eq: eqFn }) => eqFn(table.id, recipeId),
  });

  if (!sharedRecipe) {
    return null;
  }

  return {
    recipe: serializeRecipe(sharedRecipe),
    isOwner: false,
    shareId: share.id,
  };
}

export async function getShareByToken(token: string) {
  return db.query.recipeShares.findFirst({
    where: (table, { and: andFn, eq: eqFn, isNull: isNullFn }) =>
      andFn(eqFn(table.shareToken, token), isNullFn(table.revokedAt)),
  });
}

export async function getRecipeWithShareToken(user: UserPayload, token: string): Promise<RecipeAccess | null> {
  const share = await getShareByToken(token);

  if (!share) {
    return null;
  }

  if (share.sharedWithUserId && share.sharedWithUserId !== user.id) {
    return null;
  }

  if (share.sharedWithEmail && share.sharedWithEmail !== user.email) {
    return null;
  }

  const recipe = await db.query.recipes.findFirst({
    where: (table, { eq: eqFn }) => eqFn(table.id, share.recipeId),
  });

  if (!recipe) {
    return null;
  }

  return {
    recipe: serializeRecipe(recipe),
    isOwner: recipe.ownerId === user.id,
    shareId: share.id,
  };
}

export async function revokeShare(shareId: string, userId: string) {
  const result = await db
    .update(recipeShares)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(eq(recipeShares.id, shareId), eq(recipeShares.sharedBy, userId)))
    .returning({ id: recipeShares.id });

  return result[0] ?? null;
}

export async function isRecipeOwner(recipeId: string, userId: string) {
  const recipe = await db.query.recipes.findFirst({
    where: (table, { and: andFn, eq: eqFn }) => andFn(eqFn(table.id, recipeId), eqFn(table.ownerId, userId)),
  });

  return Boolean(recipe);
}
