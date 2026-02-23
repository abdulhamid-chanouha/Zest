import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const recipes = sqliteTable(
  "recipes",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    cuisine: text("cuisine"),
    prepTimeMinutes: integer("prep_time_minutes"),
    cookTimeMinutes: integer("cook_time_minutes"),
    servings: integer("servings"),
    ingredientsJson: text("ingredients_json").notNull(),
    instructions: text("instructions").notNull(),
    notes: text("notes"),
    status: text("status").notNull().default("to_try"),
    tagsJson: text("tags_json"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    statusCheck: check(
      "recipes_status_check",
      sql`${table.status} in ('favorite', 'to_try', 'made_before')`,
    ),
  }),
);

export const recipeShares = sqliteTable(
  "recipe_shares",
  {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    sharedBy: text("shared_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sharedWithUserId: text("shared_with_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    sharedWithEmail: text("shared_with_email"),
    shareToken: text("share_token").notNull().unique(),
    access: text("access").notNull().default("read"),
    revokedAt: text("revoked_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    recipeUserUnique: uniqueIndex("recipe_shares_recipe_user_unique").on(
      table.recipeId,
      table.sharedWithUserId,
    ),
    recipeEmailUnique: uniqueIndex("recipe_shares_recipe_email_unique").on(
      table.recipeId,
      table.sharedWithEmail,
    ),
  }),
);

export type RecipeStatus = "favorite" | "to_try" | "made_before";

export type Ingredient = {
  item: string;
  quantity?: string;
  unit?: string;
};

export type RecipePayload = {
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

export type UserPayload = {
  id: string;
  email: string;
  fullName: string;
};
