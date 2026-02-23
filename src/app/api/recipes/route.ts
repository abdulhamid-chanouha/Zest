import { randomUUID } from "node:crypto";

import { and, desc, eq, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { badRequest, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  sanitizeIngredients,
  sanitizeTags,
  serializeRecipe,
} from "@/lib/recipe-helpers";
import { recipes } from "@/lib/schema";
import { recipeInputSchema, recipeQuerySchema } from "@/lib/validators";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const url = new URL(request.url);
  const parsedQuery = recipeQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    ingredient: url.searchParams.get("ingredient") ?? undefined,
    cuisine: url.searchParams.get("cuisine") ?? undefined,
    maxPrepTime: url.searchParams.get("maxPrepTime") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });

  if (!parsedQuery.success) {
    return badRequest("Invalid recipe filters.", parsedQuery.error.issues);
  }

  const filters = parsedQuery.data;
  const conditions: Array<ReturnType<typeof eq>> = [eq(recipes.ownerId, user.id)];

  if (filters.q) {
    conditions.push(sql`lower(${recipes.name}) like ${`%${filters.q.toLowerCase()}%`}` as never);
  }

  if (filters.ingredient) {
    conditions.push(
      sql`lower(${recipes.ingredientsJson}) like ${`%${filters.ingredient.toLowerCase()}%`}` as never,
    );
  }

  if (filters.cuisine) {
    conditions.push(sql`lower(${recipes.cuisine}) like ${`%${filters.cuisine.toLowerCase()}%`}` as never);
  }

  if (typeof filters.maxPrepTime === "number") {
    conditions.push(lte(recipes.prepTimeMinutes, filters.maxPrepTime));
  }

  if (filters.status) {
    conditions.push(eq(recipes.status, filters.status));
  }

  const rows = await db
    .select()
    .from(recipes)
    .where(and(...conditions))
    .orderBy(desc(recipes.updatedAt));

  return NextResponse.json({ recipes: rows.map((row) => serializeRecipe(row)) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const parsed = recipeInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Invalid recipe payload.", parsed.error.issues);
  }

  const ingredients = sanitizeIngredients(parsed.data.ingredients);

  if (!ingredients.length) {
    return badRequest("Recipe must include at least one ingredient.");
  }

  const tags = sanitizeTags(parsed.data.tags ?? []);
  const now = new Date().toISOString();

  const inserted = await db
    .insert(recipes)
    .values({
      id: randomUUID(),
      ownerId: user.id,
      name: parsed.data.name,
      cuisine: parsed.data.cuisine || null,
      prepTimeMinutes: parsed.data.prepTimeMinutes ?? null,
      cookTimeMinutes: parsed.data.cookTimeMinutes ?? null,
      servings: parsed.data.servings ?? null,
      ingredientsJson: JSON.stringify(ingredients),
      instructions: parsed.data.instructions,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
      tagsJson: JSON.stringify(tags),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json({ recipe: serializeRecipe(inserted[0]) }, { status: 201 });
}
