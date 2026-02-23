import { NextResponse } from "next/server";

import { badRequest, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { generateStrictJson } from "@/lib/gemini";
import { aiParseRecipeRequestSchema, aiParsedRecipeSchema } from "@/lib/validators";

function toInstructions(value: string | string[]) {
  if (typeof value === "string") {
    return value;
  }

  return value.map((line, index) => `${index + 1}. ${line}`).join("\n");
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const parsed = aiParseRecipeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Invalid parse request.", parsed.error.issues);
  }

  const prompt = `Extract this messy recipe into strict JSON.
Schema keys: name, cuisine, prep_time_minutes, cook_time_minutes, servings, ingredients[{item,quantity,unit}], instructions, tags, notes.
Rules: valid JSON only, no markdown, unknown numeric values should be null, instructions can be string or array.
Recipe text:\n${parsed.data.text}`;

  const retryPrompt = `Return ONLY valid JSON matching this exact schema: {"name":"","cuisine":null,"prep_time_minutes":null,"cook_time_minutes":null,"servings":null,"ingredients":[{"item":"","quantity":"","unit":""}],"instructions":"","tags":[],"notes":""}. No markdown.`;

  const result = await generateStrictJson({
    prompt,
    retryPrompt,
    schema: aiParsedRecipeSchema,
  });

  return NextResponse.json({
    recipe: {
      ...result.data,
      instructions: toInstructions(result.data.instructions),
    },
  });
}
