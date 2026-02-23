import { Badge } from "@/components/ui/badge";
import type { RecipeStatus } from "@/types";

type RecipeStatusBadgeProps = {
  status: RecipeStatus;
};

const labels: Record<RecipeStatus, string> = {
  favorite: "Favorite",
  to_try: "To try",
  made_before: "Made before",
};

export function RecipeStatusBadge({ status }: RecipeStatusBadgeProps) {
  const variant = status === "favorite" ? "lemon" : status === "to_try" ? "secondary" : "outline";

  return <Badge variant={variant}>{labels[status]}</Badge>;
}
