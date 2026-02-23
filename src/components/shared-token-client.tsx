"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RecipeStatusBadge } from "@/components/recipe-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/client";
import type { Recipe } from "@/types";

type SharedTokenClientProps = {
  token: string;
};

export function SharedTokenClient({ token }: SharedTokenClientProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolveShare() {
      setLoading(true);
      try {
        await apiRequest(`/api/shares/accept/${token}`, { method: "POST" });
        const response = await apiRequest<{ recipe: Recipe }>(`/api/shared/${token}`);
        setRecipe(response.recipe);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to open shared recipe.");
      } finally {
        setLoading(false);
      }
    }

    void resolveShare();
  }, [token]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Resolving shared recipe...</CardContent>
      </Card>
    );
  }

  if (!recipe) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-sm text-muted-foreground">This shared recipe is unavailable.</p>
          <Button variant="outline" asChild>
            <Link href="/shared-with-me">Back to shared recipes</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shared recipe accepted</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-lg font-semibold">{recipe.name}</p>
        <div>
          <RecipeStatusBadge status={recipe.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          You can now view this recipe from your shared list and save your own copy.
        </p>
        <Button asChild>
          <Link href={`/recipes/${recipe.id}`}>Open recipe</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
