import { RecipeDetailClient } from "@/components/recipe-detail-client";

type RecipeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const resolved = await params;
  return <RecipeDetailClient recipeId={resolved.id} />;
}
