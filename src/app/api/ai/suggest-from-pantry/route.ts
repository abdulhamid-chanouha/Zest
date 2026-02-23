import { NextResponse } from "next/server";

import { badRequest, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateStrictJson } from "@/lib/gemini";
import { parseIngredients } from "@/lib/recipe-helpers";
import {
  aiPantryRequestSchema,
  aiPantryResponseSchema,
} from "@/lib/validators";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const parsed = aiPantryRequestSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Invalid pantry input.", parsed.error.issues);
  }

  const userRecipes = await db.query.recipes.findMany({
    where: (table, { eq: eqFn }) => eqFn(table.ownerId, user.id),
    columns: {
      id: true,
      name: true,
      cuisine: true,
      ingredientsJson: true,
    },
    limit: 40,
  });

  const compactRecipes = userRecipes.map((recipe) => ({
    name: recipe.name,
    cuisine: recipe.cuisine,
    ingredients: parseIngredients(recipe.ingredientsJson)
      .map((item) => item.item)
      .slice(0, 8),
  }));

  const prompt = `Given pantry items and user's saved recipes, suggest exactly 3 recipe ideas in strict JSON.
JSON schema: {"suggestions":[{"name":"","rationale":"","match_recipe_name":"optional","draft":{"cuisine":"","ingredients":[{"item":"","quantity":"","unit":""}],"instructions":"","tags":[]}}]}
Rules: no markdown, deterministic, short rationales, use match_recipe_name only if it exactly matches one saved recipe name.
Pantry: ${parsed.data.pantry}
Saved recipes: ${JSON.stringify(compactRecipes)}`;

  const retryPrompt = `Return strict JSON only with exactly 3 suggestions and the schema key "suggestions".`;

  const result = await generateStrictJson({
    prompt,
    retryPrompt,
    schema: aiPantryResponseSchema,
  });

  const byName = new Map(userRecipes.map((recipe) => [recipe.name.toLowerCase(), recipe.id]));

  const suggestions = result.data.suggestions.map((suggestion) => {
    const matchId = suggestion.match_recipe_name
      ? byName.get(suggestion.match_recipe_name.toLowerCase())
      : undefined;

    return {
      ...suggestion,
      matchedRecipeId: matchId,
    };
  });

  return NextResponse.json({ suggestions });
}
