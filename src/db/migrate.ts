import { migrate } from "drizzle-orm/libsql/migrator";

import { db } from "@/lib/db";

async function main() {
  await migrate(db, {
    migrationsFolder: "drizzle",
  });

  console.log("Migrations applied.");
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
