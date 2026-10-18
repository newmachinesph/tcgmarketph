import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // pg driver is used here (for DDL introspection by drizzle-kit).
    // The app itself uses @neondatabase/serverless neon-http at runtime.
    url: process.env.DATABASE_URL!,
  },
});
