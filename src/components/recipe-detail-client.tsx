"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPulse, Leaf, Scale, Share2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { RecipeFormDialog } from "@/components/recipe-form-dialog";
import { ShareRecipeDialog } from "@/components/share-recipe-dialog";
import { RecipeStatusBadge } from "@/components/recipe-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/client";
import type { Ingredient, Recipe } from "@/types";

type RecipeDetailClientProps = {
  recipeId: string;
};

type Adaptation = {
  ingredients: Ingredient[];
  instructions: string;
  servings?: number;
  summary: string;
};

export function RecipeDetailClient({ recipeId }: RecipeDetailClientProps) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [access, setAccess] = useState<"owner" | "shared">("owner");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [adaptLoading, setAdaptLoading] = useState(false);
  const [adaptDraft, setAdaptDraft] = useState<Adaptation | null>(null);
  const [scaleServings, setScaleServings] = useState("4");

  const fetchRecipe = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest<{ recipe: Recipe; access: "owner" | "shared" }>(`/api/recipes/${recipeId}`);
      setRecipe(response.recipe);
      setAccess(response.access);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load recipe.");
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    void fetchRecipe();
  }, [fetchRecipe]);

  const isOwner = access === "owner";

  const totalTime = useMemo(() => {
    if (!recipe) {
      return 0;
    }

    return (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  }, [recipe]);

  async function deleteRecipe() {
    if (!recipe || !window.confirm("Delete this recipe?")) {
      return;
    }

    try {
      await apiRequest(`/api/recipes/${recipe.id}`, {
        method: "DELETE",
      });
      toast.success("Recipe deleted.");
      router.push("/recipes");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  async function saveCopy() {
    if (!recipe) {
      return;
    }

    try {
      await apiRequest<{ recipe: Recipe }>("/api/recipes", {
        method: "POST",
        body: JSON.stringify({
          name: `${recipe.name} (Copy)`,
          cuisine: recipe.cuisine,
          prepTimeMinutes: recipe.prepTimeMinutes,
          cookTimeMinutes: recipe.cookTimeMinutes,
          servings: recipe.servings,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          notes: recipe.notes,
          status: "to_try",
          tags: recipe.tags,
        }),
      });

      toast.success("Saved to your recipes.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save copy.");
    }
  }

  async function adaptRecipe(mode: "healthier" | "vegetarian" | "scale") {
    if (!recipe) {
      return;
    }

    setAdaptLoading(true);

    try {
      const response = await apiRequest<{ adaptation: Adaptation }>("/api/ai/adapt-recipe", {
        method: "POST",
        body: JSON.stringify({
          recipeId: recipe.id,
          mode,
          targetServings: mode === "scale" ? Number(scaleServings) : undefined,
        }),
      });

      setAdaptDraft(response.adaptation);
      toast.success("Draft adaptation generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Adaptation failed.");
    } finally {
      setAdaptLoading(false);
    }
  }

  async function applyAdaptation() {
    if (!recipe || !adaptDraft) {
      return;
    }

    try {
      const response = await apiRequest<{ recipe: Recipe }>(`/api/recipes/${recipe.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ingredients: adaptDraft.ingredients,
          instructions: adaptDraft.instructions,
          servings: adaptDraft.servings ?? recipe.servings,
        }),
      });

      setRecipe(response.recipe);
      setAdaptDraft(null);
      toast.success("Draft applied to recipe.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to apply draft.");
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!recipe) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Recipe could not be loaded.</p>
          <Button className="mt-3" variant="outline" asChild>
            <Link href="/recipes">Back to recipes</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{recipe.cuisine || "General cuisine"}</p>
            <CardTitle className="text-2xl">{recipe.name}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <RecipeStatusBadge status={recipe.status} />
              <Badge variant="outline">{totalTime} min total</Badge>
              {recipe.servings ? <Badge variant="outline">{recipe.servings} servings</Badge> : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOwner ? (
              <>
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button variant="secondary" onClick={() => setShareOpen(true)}>
                  <Share2 className="mr-1 h-4 w-4" />
                  Share
                </Button>
                <Button variant="ghost" onClick={deleteRecipe}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={saveCopy}>
                Save a copy
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="recipe" className="w-full">
            <TabsList>
              <TabsTrigger value="recipe">Recipe</TabsTrigger>
              <TabsTrigger value="ai" disabled={!isOwner}>
                AI adapt
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recipe" className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ingredients</h3>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={`${ingredient.item}-${index}`} className="rounded-md border border-border/70 bg-muted/25 px-3 py-2 text-sm">
                      <span className="font-medium">{ingredient.item}</span>
                      {(ingredient.quantity || ingredient.unit) && (
                        <span className="ml-2 text-muted-foreground">
                          {ingredient.quantity ?? ""} {ingredient.unit ?? ""}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Instructions</h3>
                <div className="whitespace-pre-line rounded-md border border-border/70 bg-muted/20 px-4 py-3 text-sm leading-6">
                  {recipe.instructions}
                </div>
              </div>

              {recipe.notes ? (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notes</h3>
                    <p className="text-sm text-muted-foreground">{recipe.notes}</p>
                  </div>
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <Card className="border-yellow-100 bg-yellow-50/50">
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-yellow-900">
                    <Sparkles className="h-4 w-4" />
                    Adapt recipe with AI
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      disabled={adaptLoading}
                      onClick={() => adaptRecipe("healthier")}
                    >
                      <HeartPulse className="mr-1 h-4 w-4" />
                      Make it healthier
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={adaptLoading}
                      onClick={() => adaptRecipe("vegetarian")}
                    >
                      <Leaf className="mr-1 h-4 w-4" />
                      Make it vegetarian
                    </Button>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        value={scaleServings}
                        onChange={(event) => setScaleServings(event.target.value)}
                        className="w-24"
                      />
                      <Button variant="secondary" disabled={adaptLoading} onClick={() => adaptRecipe("scale")}>
                        <Scale className="mr-1 h-4 w-4" />
                        Scale
                      </Button>
                    </div>
                  </div>

                  {adaptDraft ? (
                    <div className="rounded-lg border border-yellow-200 bg-white p-4">
                      <p className="mb-2 text-sm font-semibold text-yellow-900">Draft summary</p>
                      <p className="text-sm text-muted-foreground">{adaptDraft.summary}</p>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Updated ingredients
                          </p>
                          <ul className="space-y-1 text-sm">
                            {adaptDraft.ingredients.map((ingredient, index) => (
                              <li key={`${ingredient.item}-${index}`}>
                                {ingredient.item}
                                {(ingredient.quantity || ingredient.unit) && (
                                  <span className="text-muted-foreground">
                                    {` (${ingredient.quantity ?? ""} ${ingredient.unit ?? ""})`}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Updated instructions
                          </p>
                          <p className="whitespace-pre-line text-sm text-muted-foreground">{adaptDraft.instructions}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button onClick={applyAdaptation}>Apply draft</Button>
                        <Button variant="outline" onClick={() => setAdaptDraft(null)}>
                          Discard
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <RecipeFormDialog
        open={editing}
        onOpenChange={setEditing}
        recipe={recipe}
        onSaved={(nextRecipe) => {
          setRecipe(nextRecipe);
          setEditing(false);
        }}
      />

      <ShareRecipeDialog recipeId={recipe.id} open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  );
}
