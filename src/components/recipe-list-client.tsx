"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock3, Edit3, Plus, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PantrySuggestions, type PantryDraft } from "@/components/pantry-suggestions";
import { RecipeFormDialog } from "@/components/recipe-form-dialog";
import { ShareRecipeDialog } from "@/components/share-recipe-dialog";
import { RecipeStatusBadge } from "@/components/recipe-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/client";
import type { Recipe } from "@/types";

function totalTime(recipe: Recipe) {
  return (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
}

export function RecipeListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [draftRecipe, setDraftRecipe] = useState<PantryDraft | null>(null);
  const [shareRecipeId, setShareRecipeId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const [ingredientFilter, setIngredientFilter] = useState(searchParams.get("ingredient") ?? "");
  const [cuisineFilter, setCuisineFilter] = useState(searchParams.get("cuisine") ?? "");
  const [maxPrepTimeFilter, setMaxPrepTimeFilter] = useState(searchParams.get("maxPrepTime") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "all");

  const activeQuery = searchParams.get("q") ?? "";

  useEffect(() => {
    setIngredientFilter(searchParams.get("ingredient") ?? "");
    setCuisineFilter(searchParams.get("cuisine") ?? "");
    setMaxPrepTimeFilter(searchParams.get("maxPrepTime") ?? "");
    setStatusFilter(searchParams.get("status") ?? "all");
  }, [searchParams]);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest<{ recipes: Recipe[] }>(
        queryString ? `/api/recipes?${queryString}` : "/api/recipes",
      );
      setRecipes(response.recipes);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load recipes.");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void fetchRecipes();
  }, [fetchRecipes, refreshToken]);

  function openCreateDialog() {
    setEditingRecipe(null);
    setDraftRecipe(null);
    setFormOpen(true);
  }

  function openEditDialog(recipe: Recipe) {
    setEditingRecipe(recipe);
    setDraftRecipe(null);
    setFormOpen(true);
  }

  function createFromPantry(draft: PantryDraft) {
    setEditingRecipe(null);
    setDraftRecipe({
      name: draft.name,
      cuisine: draft.cuisine ?? null,
      ingredients: draft.ingredients,
      instructions: draft.instructions,
      tags: draft.tags,
      status: "to_try",
    });
    setFormOpen(true);
  }

  async function deleteRecipe(recipeId: string) {
    if (!window.confirm("Delete this recipe?")) {
      return;
    }

    try {
      await apiRequest(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      });
      toast.success("Recipe deleted.");
      setRefreshToken((previous) => previous + 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());

    if (ingredientFilter.trim()) params.set("ingredient", ingredientFilter.trim());
    else params.delete("ingredient");

    if (cuisineFilter.trim()) params.set("cuisine", cuisineFilter.trim());
    else params.delete("cuisine");

    if (maxPrepTimeFilter.trim()) params.set("maxPrepTime", maxPrepTimeFilter.trim());
    else params.delete("maxPrepTime");

    if (statusFilter !== "all") params.set("status", statusFilter);
    else params.delete("status");

    const next = params.toString() ? `/recipes?${params.toString()}` : "/recipes";
    router.push(next);
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("ingredient");
    params.delete("cuisine");
    params.delete("maxPrepTime");
    params.delete("status");
    const next = params.toString() ? `/recipes?${params.toString()}` : "/recipes";
    router.push(next);
  }

  const recipesSummary = useMemo(() => {
    if (!recipes.length) {
      return "No recipes found";
    }

    return `${recipes.length} recipe${recipes.length === 1 ? "" : "s"}`;
  }, [recipes.length]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Recipes</CardTitle>
              <p className="text-sm text-muted-foreground">
                {recipesSummary}
                {activeQuery ? ` for "${activeQuery}"` : ""}
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-1 h-4 w-4" />
              New recipe
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                placeholder="Ingredient"
                value={ingredientFilter}
                onChange={(event) => setIngredientFilter(event.target.value)}
              />
              <Input
                placeholder="Cuisine"
                value={cuisineFilter}
                onChange={(event) => setCuisineFilter(event.target.value)}
              />
              <Input
                type="number"
                min={0}
                placeholder="Max prep (min)"
                value={maxPrepTimeFilter}
                onChange={(event) => setMaxPrepTimeFilter(event.target.value)}
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="to_try">To try</SelectItem>
                  <SelectItem value="favorite">Favorite</SelectItem>
                  <SelectItem value="made_before">Made before</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={applyFilters}>
                Apply filters
              </Button>
              <Button variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <PantrySuggestions onCreateDraft={createFromPantry} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Card key={`skeleton-${index}`}>
                <CardContent className="space-y-3 p-5">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))
          : null}

        {!loading && !recipes.length ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="p-8 text-center">
              <p className="text-base font-medium">No recipes yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first recipe or use pantry suggestions.</p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus className="mr-1 h-4 w-4" />
                Add recipe
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!loading
          ? recipes.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden">
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link href={`/recipes/${recipe.id}`} className="text-lg font-semibold hover:underline">
                        {recipe.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">{recipe.cuisine || "Unspecified cuisine"}</p>
                    </div>
                    <RecipeStatusBadge status={recipe.status} />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    <span>{totalTime(recipe)} min total</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {recipe.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/recipes/${recipe.id}`}>View</Link>
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openEditDialog(recipe)}>
                      <Edit3 className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShareRecipeId(recipe.id);
                        setShareOpen(true);
                      }}
                    >
                      <Share2 className="mr-1 h-4 w-4" />
                      Share
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteRecipe(recipe.id)}>
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          : null}
      </section>

      <RecipeFormDialog
        open={formOpen}
        onOpenChange={(nextOpen) => {
          setFormOpen(nextOpen);
          if (!nextOpen) {
            setEditingRecipe(null);
            setDraftRecipe(null);
          }
        }}
        recipe={editingRecipe}
        draft={draftRecipe}
        onSaved={() => {
          setRefreshToken((previous) => previous + 1);
          setEditingRecipe(null);
          setDraftRecipe(null);
        }}
      />

      <ShareRecipeDialog
        recipeId={shareRecipeId}
        open={shareOpen}
        onOpenChange={(nextOpen) => {
          setShareOpen(nextOpen);
          if (!nextOpen) {
            setShareRecipeId(null);
          }
        }}
      />
    </div>
  );
}
