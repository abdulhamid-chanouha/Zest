import { NextResponse } from "next/server";

import { getRecipeWithShareToken } from "@/lib/access";
import { notFound, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ token: string }>;
  },
) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized("Login required to use shared links.");
  }

  const params = await context.params;
  const access = await getRecipeWithShareToken(user, params.token);

  if (!access) {
    return notFound("Shared recipe not available.");
  }

  return NextResponse.json({
    recipe: access.recipe,
    access: access.isOwner ? "owner" : "shared",
  });
}
