import { prisma } from "@/lib/db/prisma";

export async function createBorrower(data: {
  fullName: string;
  phone: string;
  address?: string;
}) {
  return prisma.borrower.create({
    data,
  });
}

export async function getBorrowers() {
  return prisma.borrower.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      loans: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export async function getBorrowerById(id: string) {
  return prisma.borrower.findUnique({
    where: {
      id,
    },
    include: {
      loans: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export async function updateBorrower(
  id: string,
  data: {
    fullName?: string;
    phone?: string;
    address?: string | null;
  }
) {
  return prisma.borrower.update({
    where: {
      id,
    },
    data,
  });
}