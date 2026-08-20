import { prisma } from "@/lib/db/prisma";
import NewLoanForm from "./NewLoanForm";

export const dynamic = "force-dynamic";

export default async function NewLoanPage() {
  const borrowers = await prisma.borrower.findMany({
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, phone: true },
  });

  return <NewLoanForm borrowers={borrowers} />;
}
