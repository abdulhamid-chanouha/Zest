"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { RecipeStatusBadge } from "@/components/recipe-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/client";
import type { Recipe, ShareReceived } from "@/types";

export function SharedWithMeClient() {
  const [shares, setShares] = useState<ShareReceived[]>([]);
  const [loading, setLoading] = useState(true);

  const loadShares = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest<{ shares: ShareReceived[] }>("/api/shares/received");
      setShares(response.shares);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load shares.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadShares();
  }, [loadShares]);

  async function saveCopy(recipeId: string) {
    try {
      const detail = await apiRequest<{ recipe: Recipe }>(`/api/recipes/${recipeId}`);

      await apiRequest("/api/recipes", {
        method: "POST",
        body: JSON.stringify({
          name: `${detail.recipe.name} (Copy)`,
          cuisine: detail.recipe.cuisine,
          prepTimeMinutes: detail.recipe.prepTimeMinutes,
          cookTimeMinutes: detail.recipe.cookTimeMinutes,
          servings: detail.recipe.servings,
          ingredients: detail.recipe.ingredients,
          instructions: detail.recipe.instructions,
          notes: detail.recipe.notes,
          status: "to_try",
          tags: detail.recipe.tags,
        }),
      });

      toast.success("Saved a copy to your recipes.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save copy.");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Shared with me</CardTitle>
        </CardHeader>
      </Card>

      {loading
        ? Array.from({ length: 3 }).map((_, index) => (
            <Card key={`share-skeleton-${index}`}>
              <CardContent className="space-y-2 p-5">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        : null}

      {!loading && !shares.length ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">No shared recipes yet.</CardContent>
        </Card>
      ) : null}

      {!loading
        ? shares.map((share) => (
            <Card key={share.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold">{share.recipeName}</p>
                    <p className="text-sm text-muted-foreground">
                      Shared by {share.sharedByName} ({share.sharedByEmail})
                    </p>
                  </div>
                  <RecipeStatusBadge status={share.status} />
                </div>

                <div className="flex flex-wrap gap-1">
                  {share.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/recipes/${share.recipeId}`}>View recipe</Link>
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => saveCopy(share.recipeId)}>
                    Save a copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        : null}
    </div>
  );
}
