import { NextResponse } from "next/server";

import { getRecipeAccess } from "@/lib/access";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { generateStrictJson } from "@/lib/gemini";
import { aiAdaptRequestSchema, aiAdaptResponseSchema } from "@/lib/validators";

function formatRecipeForPrompt(recipe: {
  name: string;
  cuisine: string | null;
  servings: number | null;
  ingredients: Array<{ item: string; quantity?: string; unit?: string }>;
  instructions: string;
}) {
  return {
    name: recipe.name,
    cuisine: recipe.cuisine,
    servings: recipe.servings,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
  };
}

function adaptationInstruction(mode: "healthier" | "vegetarian" | "scale", targetServings?: number) {
  if (mode === "healthier") {
    return "Adjust this recipe to be healthier while preserving flavor.";
  }

  if (mode === "vegetarian") {
    return "Adapt this recipe to vegetarian form while keeping it practical and tasty.";
  }

  return `Scale this recipe to ${targetServings} servings.`;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const parsed = aiAdaptRequestSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Invalid adapt request.", parsed.error.issues);
  }

  if (parsed.data.mode === "scale" && !parsed.data.targetServings) {
    return badRequest("targetServings is required when mode is scale.");
  }

  const access = await getRecipeAccess(user, parsed.data.recipeId);

  if (!access) {
    return notFound("Recipe not found.");
  }

  if (!access.isOwner) {
    return forbidden("Only owners can generate recipe adaptations.");
  }

  const prompt = `Adapt this recipe and return strict JSON only.
JSON schema: {"ingredients":[{"item":"","quantity":"","unit":""}],"instructions":"","servings":1,"summary":""}
Task: ${adaptationInstruction(parsed.data.mode, parsed.data.targetServings)}
Recipe: ${JSON.stringify(formatRecipeForPrompt(access.recipe))}`;

  const retryPrompt = `Return ONLY valid JSON with keys ingredients, instructions, servings, summary.`;

  const result = await generateStrictJson({
    prompt,
    retryPrompt,
    schema: aiAdaptResponseSchema,
  });

  return NextResponse.json({ adaptation: result.data });
}
