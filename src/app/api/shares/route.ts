import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { badRequest, conflict, forbidden, notFound, unauthorized } from "@/lib/api";
import { generateToken, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/recipe-helpers";
import { recipeShares } from "@/lib/schema";
import { shareCreateSchema } from "@/lib/validators";

function createShareUrl(token: string) {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/shared/${token}`;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const body = await request.json().catch(() => null);
  const parsed = shareCreateSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Invalid share payload.", parsed.error.issues);
  }

  const recipe = await db.query.recipes.findFirst({
    where: (table, { and: andFn, eq: eqFn }) =>
      andFn(eqFn(table.id, parsed.data.recipeId), eqFn(table.ownerId, user.id)),
  });

  if (!recipe) {
    return notFound("Recipe not found.");
  }

  let targetEmail: string | null = null;
  let targetUserId: string | null = null;

  if (parsed.data.email) {
    targetEmail = normalizeEmail(parsed.data.email);

    if (targetEmail === user.email) {
      return forbidden("You cannot share a recipe with yourself.");
    }

    const existingUser = await db.query.users.findFirst({
      where: (table, { eq: eqFn }) => eqFn(table.email, targetEmail as string),
    });

    if (existingUser) {
      targetUserId = existingUser.id;
    }
  }

  if (!targetEmail && !parsed.data.generateLink) {
    return badRequest("Provide an email or generate a link share.");
  }

  let existingShare:
    | {
        id: string;
        shareToken: string;
        revokedAt: string | null;
      }
    | undefined;

  if (targetUserId && targetEmail) {
    existingShare = await db.query.recipeShares.findFirst({
      where: (table, { and: andFn, eq: eqFn, or: orFn }) =>
        andFn(
          eqFn(table.recipeId, parsed.data.recipeId),
          orFn(eqFn(table.sharedWithUserId, targetUserId), eqFn(table.sharedWithEmail, targetEmail)),
        ),
      columns: {
        id: true,
        shareToken: true,
        revokedAt: true,
      },
    });
  } else if (targetUserId) {
    existingShare = await db.query.recipeShares.findFirst({
      where: (table, { and: andFn, eq: eqFn }) =>
        andFn(eqFn(table.recipeId, parsed.data.recipeId), eqFn(table.sharedWithUserId, targetUserId)),
      columns: {
        id: true,
        shareToken: true,
        revokedAt: true,
      },
    });
  } else if (targetEmail) {
    existingShare = await db.query.recipeShares.findFirst({
      where: (table, { and: andFn, eq: eqFn }) =>
        andFn(eqFn(table.recipeId, parsed.data.recipeId), eqFn(table.sharedWithEmail, targetEmail)),
      columns: {
        id: true,
        shareToken: true,
        revokedAt: true,
      },
    });
  }

  const shareToken = generateToken();

  if (existingShare) {
    if (existingShare.revokedAt) {
      const reactivated = await db
        .update(recipeShares)
        .set({
          revokedAt: null,
          shareToken,
          sharedWithEmail: targetEmail,
          sharedWithUserId: targetUserId,
        })
        .where(eq(recipeShares.id, existingShare.id))
        .returning();

      return NextResponse.json({
        share: reactivated[0],
        shareUrl: createShareUrl(reactivated[0].shareToken),
      });
    }

    return conflict("This recipe is already shared with that recipient.");
  }

  const inserted = await db
    .insert(recipeShares)
    .values({
      id: randomUUID(),
      recipeId: parsed.data.recipeId,
      sharedBy: user.id,
      sharedWithUserId: targetUserId,
      sharedWithEmail: targetEmail,
      shareToken,
      access: "read",
    })
    .returning();

  return NextResponse.json({
    share: inserted[0],
    shareUrl: createShareUrl(inserted[0].shareToken),
  });
}
