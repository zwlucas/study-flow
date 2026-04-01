"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migrator_1 = require("drizzle-orm/better-sqlite3/migrator");
const index_1 = require("./index");
console.log("Running migrations...");
try {
    // Execute migrations from the generated folder
    (0, migrator_1.migrate)(index_1.db, { migrationsFolder: "./migrations" });
    console.log("Migrations applied successfully!");
}
catch (error) {
    console.error("Error applying migrations:", error);
    process.exit(1);
}
