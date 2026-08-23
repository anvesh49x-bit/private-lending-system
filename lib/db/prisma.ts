import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

let prismaClient = globalForPrisma.prisma;

if (!prismaClient) {
  const adapter = new PrismaPg({
    connectionString,
    max: 1, // Limit each Vercel serverless function to 1 connection to avoid exhausting the 15 connection limit
  } as any);

  prismaClient = new PrismaClient({
    adapter,
  });
}

export const prisma = prismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
