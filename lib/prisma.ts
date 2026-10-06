import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL est introuvable dans l'environnement du serveur.");
}

const endpoint = new URL(databaseUrl);

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? value as Record<string, unknown>
    : {};
}

function diagnosticValue(value: unknown): string | undefined {
  return typeof value === "string" && /^[a-zA-Z0-9_]{1,80}$/.test(value)
    ? value
    : undefined;
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter }).$extends({
    name: "safe-database-diagnostics",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          try {
            return await query(args);
          } catch (error) {
            const details = record(error);
            const driver = record(record(details.meta).driverAdapterError);
            const cause = record(driver.cause);
            console.error("[NACHTKRONE_DATABASE_ERROR]", JSON.stringify({
              model,
              operation,
              code: diagnosticValue(details.code),
              driverKind: diagnosticValue(cause.kind),
              driverCode: diagnosticValue(cause.originalCode),
              causeCode: diagnosticValue(record(details.cause).code),
              host: endpoint.hostname,
              port: endpoint.port || "5432",
              database: endpoint.pathname,
              sslMode: endpoint.searchParams.get("sslmode"),
            }));
            throw error;
          }
        },
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
export default prisma;
