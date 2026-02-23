export type RecipeStatus = "favorite" | "to_try" | "made_before";

export type Ingredient = {
  item: string;
  quantity?: string;
  unit?: string;
};

export type Recipe = {
  id: string;
  ownerId: string;
  name: string;
  cuisine: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: number | null;
  ingredients: Ingredient[];
  instructions: string;
  notes: string | null;
  status: RecipeStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  email: string;
  fullName: string;
};

export type ShareReceived = {
  id: string;
  recipeId: string;
  recipeName: string;
  cuisine: string | null;
  status: RecipeStatus;
  prepTimeMinutes: number | null;
  tags: string[];
  sharedByName: string;
  sharedByEmail: string;
  shareToken: string;
  createdAt: string;
};

export type ShareSent = {
  id: string;
  recipeId: string;
  recipeName: string;
  sharedWithEmail: string | null;
  sharedWithUserId: string | null;
  recipientName: string | null;
  shareToken: string;
  revokedAt: string | null;
  createdAt: string;
};
