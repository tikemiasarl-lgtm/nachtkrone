import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * NACHTKRONE — Configuration Prisma 7
 *
 * DATABASE_URL :
 * utilisée par l'application via lib/prisma.ts.
 *
 * DIRECT_URL :
 * utilisée par Prisma CLI pour les migrations,
 * db push et les opérations sur le schéma.
 */

const prismaDatabaseUrl =
  process.env["DIRECT_URL"] || process.env["DATABASE_URL"];

if (!prismaDatabaseUrl) {
  throw new Error(
    "DIRECT_URL ou DATABASE_URL est introuvable dans le fichier .env."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: prismaDatabaseUrl,
  },
});