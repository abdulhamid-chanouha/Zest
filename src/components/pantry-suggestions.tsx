"use client";

import Link from "next/link";
import { ChefHat, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/client";
import type { Ingredient, RecipeStatus } from "@/types";

export type PantryDraft = {
  name: string;
  cuisine?: string | null;
  ingredients?: Ingredient[];
  instructions?: string;
  tags?: string[];
  status?: RecipeStatus;
};

type Suggestion = {
  name: string;
  rationale: string;
  match_recipe_name?: string;
  matchedRecipeId?: string;
  draft?: {
    cuisine?: string;
    ingredients?: Ingredient[];
    instructions?: string;
    tags?: string[];
  };
};

type PantrySuggestionsProps = {
  onCreateDraft: (draft: PantryDraft) => void;
};

export function PantrySuggestions({ onCreateDraft }: PantrySuggestionsProps) {
  const [pantry, setPantry] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  async function generateSuggestions() {
    if (!pantry.trim()) {
      toast.error("Enter pantry ingredients first.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest<{ suggestions: Suggestion[] }>("/api/ai/suggest-from-pantry", {
        method: "POST",
        body: JSON.stringify({ pantry }),
      });

      setSuggestions(response.suggestions);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to get suggestions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-yellow-100/80 bg-yellow-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-yellow-700" />
          Cook with what you have
        </CardTitle>
        <CardDescription>
          Add pantry ingredients and get three AI suggestions based on your saved recipes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={pantry}
            onChange={(event) => setPantry(event.target.value)}
            placeholder="chickpeas, lemon, garlic, spinach"
          />
          <Button type="button" onClick={generateSuggestions} disabled={loading}>
            {loading ? "Thinking..." : "Suggest"}
          </Button>
        </div>

        {suggestions.length ? (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={`${suggestion.name}-${index}`} className="rounded-lg border border-border/70 bg-background p-3">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <ChefHat className="h-4 w-4 text-yellow-800" />
                  <p className="font-medium">{suggestion.name}</p>
                  {suggestion.matchedRecipeId ? <Badge variant="lemon">Matches saved recipe</Badge> : null}
                </div>
                <p className="text-sm text-muted-foreground">{suggestion.rationale}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestion.matchedRecipeId ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/recipes/${suggestion.matchedRecipeId}`}>Open recipe</Link>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        onCreateDraft({
                          name: suggestion.name,
                          cuisine: suggestion.draft?.cuisine,
                          ingredients: suggestion.draft?.ingredients,
                          instructions: suggestion.draft?.instructions,
                          tags: suggestion.draft?.tags,
                        })
                      }
                    >
                      Create new recipe draft
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
