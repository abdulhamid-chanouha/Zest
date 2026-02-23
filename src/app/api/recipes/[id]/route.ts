import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getRecipeAccess } from "@/lib/access";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeIngredients, sanitizeTags, serializeRecipe } from "@/lib/recipe-helpers";
import { recipes } from "@/lib/schema";
import { recipePatchSchema } from "@/lib/validators";

export async function GET(
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
  const access = await getRecipeAccess(user, params.id);

  if (!access) {
    return notFound("Recipe not found.");
  }

  return NextResponse.json({
    recipe: access.recipe,
    access: access.isOwner ? "owner" : "shared",
  });
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const params = await context.params;
  const access = await getRecipeAccess(user, params.id);

  if (!access) {
    return notFound("Recipe not found.");
  }

  if (!access.isOwner) {
    return forbidden("Only owners can edit recipes.");
  }

  const body = await request.json().catch(() => null);
  const parsed = recipePatchSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Invalid recipe update.", parsed.error.issues);
  }

  const updateData: Partial<{
    name: string;
    cuisine: string | null;
    prepTimeMinutes: number | null;
    cookTimeMinutes: number | null;
    servings: number | null;
    ingredientsJson: string;
    instructions: string;
    notes: string | null;
    status: "favorite" | "to_try" | "made_before";
    tagsJson: string;
    updatedAt: string;
  }> = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof parsed.data.name === "string") updateData.name = parsed.data.name;
  if (parsed.data.cuisine !== undefined) updateData.cuisine = parsed.data.cuisine || null;
  if (parsed.data.prepTimeMinutes !== undefined) updateData.prepTimeMinutes = parsed.data.prepTimeMinutes;
  if (parsed.data.cookTimeMinutes !== undefined) updateData.cookTimeMinutes = parsed.data.cookTimeMinutes;
  if (parsed.data.servings !== undefined) updateData.servings = parsed.data.servings;
  if (typeof parsed.data.instructions === "string") updateData.instructions = parsed.data.instructions;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes || null;
  if (parsed.data.status) updateData.status = parsed.data.status;

  if (parsed.data.ingredients) {
    const ingredients = sanitizeIngredients(parsed.data.ingredients);
    if (!ingredients.length) {
      return badRequest("Recipe must include at least one ingredient.");
    }
    updateData.ingredientsJson = JSON.stringify(ingredients);
  }

  if (parsed.data.tags) {
    updateData.tagsJson = JSON.stringify(sanitizeTags(parsed.data.tags));
  }

  const updated = await db
    .update(recipes)
    .set(updateData)
    .where(and(eq(recipes.id, params.id), eq(recipes.ownerId, user.id)))
    .returning();

  if (!updated[0]) {
    return notFound("Recipe not found.");
  }

  return NextResponse.json({ recipe: serializeRecipe(updated[0]) });
}

export async function DELETE(
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

  const deleted = await db
    .delete(recipes)
    .where(and(eq(recipes.id, params.id), eq(recipes.ownerId, user.id)))
    .returning({ id: recipes.id });

  if (!deleted[0]) {
    return notFound("Recipe not found.");
  }

  return NextResponse.json({ ok: true });
}
