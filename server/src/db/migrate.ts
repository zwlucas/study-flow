import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./index";

console.log("Running migrations...");

try {
  // Execute migrations from the generated folder
  migrate(db, { migrationsFolder: "./migrations" });
  console.log("Migrations applied successfully!");
} catch (error) {
  console.error("Error applying migrations:", error);
  process.exit(1);
}
