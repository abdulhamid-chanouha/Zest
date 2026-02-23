import type { Ingredient, RecipePayload } from "@/lib/schema";

type RawRecipe = {
  id: string;
  ownerId: string;
  name: string;
  cuisine: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  ingredientsJson: string;
  instructions: string;
  notes: string | null;
  status: string;
  tagsJson: string | null;
  createdAt: string;
  updatedAt: string;
};

export function parseIngredients(value: string): Ingredient[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry) => typeof entry?.item === "string" && entry.item.trim().length > 0)
      .map((entry) => ({
        item: String(entry.item).trim(),
        quantity: typeof entry.quantity === "string" ? entry.quantity : undefined,
        unit: typeof entry.unit === "string" ? entry.unit : undefined,
      }));
  } catch {
    return [];
  }
}

export function parseTags(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((tag) => typeof tag === "string" && tag.trim().length > 0);
  } catch {
    return [];
  }
}

export function serializeRecipe(raw: RawRecipe): RecipePayload {
  return {
    id: raw.id,
    ownerId: raw.ownerId,
    name: raw.name,
    cuisine: raw.cuisine,
    prepTimeMinutes: raw.prepTimeMinutes,
    cookTimeMinutes: raw.cookTimeMinutes,
    servings: raw.servings,
    ingredients: parseIngredients(raw.ingredientsJson),
    instructions: raw.instructions,
    notes: raw.notes,
    status: raw.status as RecipePayload["status"],
    tags: parseTags(raw.tagsJson),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function sanitizeIngredients(ingredients: Ingredient[]) {
  return ingredients
    .map((ingredient) => ({
      item: ingredient.item.trim(),
      quantity: ingredient.quantity?.trim() || undefined,
      unit: ingredient.unit?.trim() || undefined,
    }))
    .filter((ingredient) => ingredient.item.length > 0);
}

export function sanitizeTags(tags: string[]) {
  return tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 20);
}
