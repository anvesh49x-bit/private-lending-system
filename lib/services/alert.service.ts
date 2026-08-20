import { prisma } from "@/lib/db/prisma";
import { getCalculatedLoanStatus } from "./payment.service";

export type LoanAlert = {
  loanId: string;
  borrowerId: string;
  borrowerName: string;
  endDate: Date;
  daysOverdue?: number;
  daysUntilDue?: number;
  remainingPrincipal: number;
  remainingInterest: number;
  totalOutstanding: number;
};

export async function getLoanAlerts() {
  const calculationDate = new Date();
  
  // Calculate midnight times for accurate day comparisons
  const nowMs = new Date(calculationDate.getFullYear(), calculationDate.getMonth(), calculationDate.getDate()).getTime();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const allLoans = await prisma.loan.findMany({
    include: {
      borrower: {
        select: {
          fullName: true,
        },
      },
      allocations: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  const overdueLoans: LoanAlert[] = [];
  const dueSoonLoans: LoanAlert[] = [];
  let overdueAmount = 0;
  let dueSoonAmount = 0;

  for (const loan of allLoans) {
    if (!loan.endDate) continue;

    const calc = getCalculatedLoanStatus(loan, calculationDate);

    // Only alert on active loans with > 0 outstanding
    if (calc.status !== "ACTIVE" || calc.totalOutstanding <= 0) {
      continue;
    }

    const endDateMs = new Date(loan.endDate.getFullYear(), loan.endDate.getMonth(), loan.endDate.getDate()).getTime();
    
    // Difference in days
    const diffDays = Math.floor((endDateMs - nowMs) / MS_PER_DAY);

    if (diffDays < 0) {
      // Overdue
      const daysOverdue = Math.abs(diffDays);
      overdueLoans.push({
        loanId: loan.id,
        borrowerId: loan.borrowerId,
        borrowerName: loan.borrower.fullName,
        endDate: loan.endDate,
        daysOverdue,
        remainingPrincipal: calc.remainingPrincipal,
        remainingInterest: calc.remainingInterest,
        totalOutstanding: calc.totalOutstanding,
      });
      overdueAmount += calc.totalOutstanding;
    } else if (diffDays >= 0 && diffDays <= 7) {
      // Due Soon (today or within 7 days)
      dueSoonLoans.push({
        loanId: loan.id,
        borrowerId: loan.borrowerId,
        borrowerName: loan.borrower.fullName,
        endDate: loan.endDate,
        daysUntilDue: diffDays,
        remainingPrincipal: calc.remainingPrincipal,
        remainingInterest: calc.remainingInterest,
        totalOutstanding: calc.totalOutstanding,
      });
      dueSoonAmount += calc.totalOutstanding;
    }
  }

  // Sort by highest outstanding and shortest time
  overdueLoans.sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  dueSoonLoans.sort((a, b) => (a.daysUntilDue || 0) - (b.daysUntilDue || 0) || b.totalOutstanding - a.totalOutstanding);

  return {
    overdueLoans,
    dueSoonLoans,
    overdueCount: overdueLoans.length,
    dueSoonCount: dueSoonLoans.length,
    overdueAmount,
    dueSoonAmount,
  };
}
