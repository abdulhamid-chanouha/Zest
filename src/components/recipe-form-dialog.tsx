"use client";

import { Plus, Sparkles, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/client";
import type { Ingredient, Recipe, RecipeStatus } from "@/types";

type RecipeDraft = {
  name?: string;
  cuisine?: string | null;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  servings?: number | null;
  ingredients?: Ingredient[];
  instructions?: string;
  notes?: string | null;
  tags?: string[];
  status?: RecipeStatus;
};

type RecipeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe?: Recipe | null;
  draft?: RecipeDraft | null;
  onSaved: (recipe: Recipe) => void;
};

const emptyIngredient: Ingredient = { item: "", quantity: "", unit: "" };

function toNumberOrNull(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function RecipeFormDialog({ open, onOpenChange, recipe, draft, onSaved }: RecipeFormDialogProps) {
  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState("");
  const [cookTimeMinutes, setCookTimeMinutes] = useState("");
  const [servings, setServings] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ ...emptyIngredient }]);
  const [instructions, setInstructions] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<RecipeStatus>("to_try");
  const [tagsInput, setTagsInput] = useState("");
  const [messyRecipeText, setMessyRecipeText] = useState("");
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);

  const isEditing = Boolean(recipe?.id);

  const normalizedInitial = useMemo(() => {
    const source = recipe ?? draft;

    if (!source) {
      return null;
    }

    return {
      name: source.name ?? "",
      cuisine: source.cuisine ?? "",
      prepTimeMinutes: source.prepTimeMinutes?.toString() ?? "",
      cookTimeMinutes: source.cookTimeMinutes?.toString() ?? "",
      servings: source.servings?.toString() ?? "",
      ingredients:
        source.ingredients && source.ingredients.length > 0
          ? source.ingredients.map((ingredient) => ({
              item: ingredient.item ?? "",
              quantity: ingredient.quantity ?? "",
              unit: ingredient.unit ?? "",
            }))
          : [{ ...emptyIngredient }],
      instructions: source.instructions ?? "",
      notes: source.notes ?? "",
      status: source.status ?? "to_try",
      tagsInput: source.tags?.join(", ") ?? "",
    };
  }, [draft, recipe]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!normalizedInitial) {
      setName("");
      setCuisine("");
      setPrepTimeMinutes("");
      setCookTimeMinutes("");
      setServings("");
      setIngredients([{ ...emptyIngredient }]);
      setInstructions("");
      setNotes("");
      setStatus("to_try");
      setTagsInput("");
      setMessyRecipeText("");
      return;
    }

    setName(normalizedInitial.name);
    setCuisine(normalizedInitial.cuisine);
    setPrepTimeMinutes(normalizedInitial.prepTimeMinutes);
    setCookTimeMinutes(normalizedInitial.cookTimeMinutes);
    setServings(normalizedInitial.servings);
    setIngredients(normalizedInitial.ingredients);
    setInstructions(normalizedInitial.instructions);
    setNotes(normalizedInitial.notes);
    setStatus(normalizedInitial.status);
    setTagsInput(normalizedInitial.tagsInput);
    setMessyRecipeText("");
  }, [normalizedInitial, open]);

  function updateIngredient(index: number, patch: Partial<Ingredient>) {
    setIngredients((previous) => previous.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function addIngredientRow() {
    setIngredients((previous) => [...previous, { ...emptyIngredient }]);
  }

  function removeIngredientRow(index: number) {
    setIngredients((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  }

  async function parseRecipe() {
    if (!messyRecipeText.trim()) {
      toast.error("Paste recipe text first.");
      return;
    }

    setParsing(true);

    try {
      const payload = await apiRequest<{
        recipe: {
          name: string;
          cuisine?: string | null;
          prep_time_minutes?: number | null;
          cook_time_minutes?: number | null;
          servings?: number | null;
          ingredients: Ingredient[];
          instructions: string;
          tags?: string[];
          notes?: string;
        };
      }>("/api/ai/parse-recipe", {
        method: "POST",
        body: JSON.stringify({ text: messyRecipeText }),
      });

      setName(payload.recipe.name ?? "");
      setCuisine(payload.recipe.cuisine ?? "");
      setPrepTimeMinutes(payload.recipe.prep_time_minutes?.toString() ?? "");
      setCookTimeMinutes(payload.recipe.cook_time_minutes?.toString() ?? "");
      setServings(payload.recipe.servings?.toString() ?? "");
      setIngredients(payload.recipe.ingredients.length ? payload.recipe.ingredients : [{ ...emptyIngredient }]);
      setInstructions(payload.recipe.instructions ?? "");
      setTagsInput((payload.recipe.tags ?? []).join(", "));
      setNotes(payload.recipe.notes ?? "");

      toast.success("Recipe parsed and form populated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Recipe parsing failed.");
    } finally {
      setParsing(false);
    }
  }

  async function submitForm(event: FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      const body = {
        name,
        cuisine: cuisine || null,
        prepTimeMinutes: toNumberOrNull(prepTimeMinutes),
        cookTimeMinutes: toNumberOrNull(cookTimeMinutes),
        servings: toNumberOrNull(servings),
        ingredients,
        instructions,
        notes: notes || null,
        status,
        tags: splitTags(tagsInput),
      };

      const endpoint = isEditing ? `/api/recipes/${recipe?.id}` : "/api/recipes";
      const method = isEditing ? "PATCH" : "POST";

      const payload = await apiRequest<{ recipe: Recipe }>(endpoint, {
        method,
        body: JSON.stringify(body),
      });

      onSaved(payload.recipe);
      toast.success(isEditing ? "Recipe updated." : "Recipe created.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save recipe.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit recipe" : "Create recipe"}</DialogTitle>
          <DialogDescription>
            Keep recipes structured so search, sharing, and AI adaptation stay accurate.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={submitForm}>
          <div className="rounded-xl border border-yellow-200/70 bg-yellow-50/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-900">
              <Sparkles className="h-4 w-4" />
              Paste recipe to auto-fill
            </div>
            <Textarea
              placeholder="Paste a messy recipe, blog snippet, or notes..."
              value={messyRecipeText}
              onChange={(event) => setMessyRecipeText(event.target.value)}
              className="mb-3 min-h-28"
            />
            <Button type="button" variant="secondary" onClick={parseRecipe} disabled={parsing}>
              {parsing ? "Parsing..." : "Parse with AI"}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="recipe-name">Name</Label>
              <Input id="recipe-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipe-cuisine">Cuisine</Label>
              <Input id="recipe-cuisine" value={cuisine} onChange={(event) => setCuisine(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as RecipeStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to_try">To try</SelectItem>
                  <SelectItem value="favorite">Favorite</SelectItem>
                  <SelectItem value="made_before">Made before</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prep-time">Prep time (min)</Label>
              <Input
                id="prep-time"
                type="number"
                min={0}
                value={prepTimeMinutes}
                onChange={(event) => setPrepTimeMinutes(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cook-time">Cook time (min)</Label>
              <Input
                id="cook-time"
                type="number"
                min={0}
                value={cookTimeMinutes}
                onChange={(event) => setCookTimeMinutes(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                type="number"
                min={1}
                value={servings}
                onChange={(event) => setServings(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipe-tags">Tags (comma separated)</Label>
              <Input
                id="recipe-tags"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="weeknight, healthy"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Ingredients</Label>
              <Button type="button" variant="outline" size="sm" onClick={addIngredientRow}>
                <Plus className="mr-1 h-4 w-4" /> Add row
              </Button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <div key={`${index}-${ingredient.item}`} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
                  <Input
                    placeholder="Ingredient"
                    value={ingredient.item}
                    onChange={(event) => updateIngredient(index, { item: event.target.value })}
                  />
                  <Input
                    placeholder="Qty"
                    value={ingredient.quantity ?? ""}
                    onChange={(event) => updateIngredient(index, { quantity: event.target.value })}
                  />
                  <Input
                    placeholder="Unit"
                    value={ingredient.unit ?? ""}
                    onChange={(event) => updateIngredient(index, { unit: event.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIngredientRow(index)}
                    disabled={ingredients.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              className="min-h-36"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save changes" : "Create recipe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
