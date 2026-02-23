import { z } from "zod";

export const recipeStatusSchema = z.enum(["favorite", "to_try", "made_before"]);

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email(),
  password: z.string().min(8).max(72),
});

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
});

export const ingredientSchema = z.object({
  item: z.string().trim().min(1).max(120),
  quantity: z.string().trim().max(40).optional(),
  unit: z.string().trim().max(40).optional(),
});

export const recipeInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  cuisine: z.string().trim().max(80).optional().nullable(),
  prepTimeMinutes: z.number().int().min(0).max(10080).optional().nullable(),
  cookTimeMinutes: z.number().int().min(0).max(10080).optional().nullable(),
  servings: z.number().int().min(1).max(1000).optional().nullable(),
  ingredients: z.array(ingredientSchema).min(1),
  instructions: z.string().trim().min(1),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: recipeStatusSchema.default("to_try"),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export const recipePatchSchema = recipeInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export const recipeQuerySchema = z.object({
  q: z.string().trim().optional(),
  ingredient: z.string().trim().optional(),
  cuisine: z.string().trim().optional(),
  maxPrepTime: z.coerce.number().int().min(0).max(10080).optional(),
  status: recipeStatusSchema.optional(),
});

export const shareCreateSchema = z
  .object({
    recipeId: z.string().min(1),
    email: z.email().optional(),
    generateLink: z.boolean().optional(),
  })
  .refine((value) => Boolean(value.email) || value.generateLink === true, {
    message: "Provide email or request link generation.",
  });

export const aiParsedRecipeSchema = z.object({
  name: z.string().min(1),
  cuisine: z.string().nullable().optional(),
  prep_time_minutes: z.number().int().min(0).nullable().optional(),
  cook_time_minutes: z.number().int().min(0).nullable().optional(),
  servings: z.number().int().min(1).nullable().optional(),
  ingredients: z
    .array(
      z.object({
        item: z.string().min(1),
        quantity: z.string().optional(),
        unit: z.string().optional(),
      }),
    )
    .min(1),
  instructions: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
});

export const aiParseRecipeRequestSchema = z.object({
  text: z.string().trim().min(10),
});

export const aiPantryRequestSchema = z.object({
  pantry: z.string().trim().min(2),
});

export const aiPantrySuggestionSchema = z.object({
  name: z.string().min(1),
  rationale: z.string().min(1),
  match_recipe_name: z.string().optional(),
  draft: z
    .object({
      cuisine: z.string().optional(),
      ingredients: z
        .array(
          z.object({
            item: z.string().min(1),
            quantity: z.string().optional(),
            unit: z.string().optional(),
          }),
        )
        .optional(),
      instructions: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
});

export const aiPantryResponseSchema = z.object({
  suggestions: z.array(aiPantrySuggestionSchema).length(3),
});

export const aiAdaptRequestSchema = z.object({
  recipeId: z.string().min(1),
  mode: z.enum(["healthier", "vegetarian", "scale"]),
  targetServings: z.number().int().min(1).max(1000).optional(),
});

export const aiAdaptResponseSchema = z.object({
  ingredients: z.array(ingredientSchema).min(1),
  instructions: z.string().min(1),
  servings: z.number().int().min(1).optional(),
  summary: z.string().min(1),
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
});
