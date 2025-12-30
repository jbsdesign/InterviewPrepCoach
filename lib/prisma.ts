// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore PrismaClient types are provided by the generated Prisma client at runtime.
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaBetterSqlite3({
      url: "file:./prisma/dev.db",
    });

    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: ["error", "warn"],
    });
  }

  return globalForPrisma.prisma;
}
