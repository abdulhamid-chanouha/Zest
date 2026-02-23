import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";
import { recipes, users } from "@/lib/schema";
import { hashPassword } from "@/lib/auth";

async function main() {
  const email = "demo@zest.app";

  const existing = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.email, email),
  });

  if (existing) {
    console.log("Seed skipped: demo user already exists.");
    return;
  }

  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email,
    fullName: "Demo Chef",
    passwordHash: await hashPassword("password123"),
  });

  await db.insert(recipes).values({
    id: randomUUID(),
    ownerId: userId,
    name: "Lemon Herb Quinoa Bowl",
    cuisine: "Mediterranean",
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    servings: 2,
    ingredientsJson: JSON.stringify([
      { item: "quinoa", quantity: "1", unit: "cup" },
      { item: "chickpeas", quantity: "1", unit: "cup" },
      { item: "lemon", quantity: "1", unit: "whole" },
    ]),
    instructions: "Cook quinoa. Warm chickpeas. Toss with lemon juice and herbs.",
    status: "favorite",
    tagsJson: JSON.stringify(["quick", "healthy"]),
  });

  console.log("Seed completed. Demo account: demo@zest.app / password123");
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
