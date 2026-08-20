import { prisma } from "@/lib/db/prisma";
import { getCalculatedLoanStatus } from "./payment.service";

export async function getDashboardData() {
  const calculationDate = new Date();

  // 1. Fetch aggregate basic counts
  const totalBorrowers = await prisma.borrower.count();

  const totalReceivedResult = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: "COMPLETED" },
  });
  const totalReceived = Number(totalReceivedResult._sum.amount || 0);

  // 2. Fetch all loans with allocations to do safe financial calculations
  const allLoans = await prisma.loan.findMany({
    include: {
      borrower: {
        select: {
          fullName: true,
          phone: true,
        },
      },
      allocations: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  let totalPrincipalLent = 0;
  let activeLoansCount = 0;
  let closedLoansCount = 0;
  let totalPrincipalRemaining = 0;
  let totalInterestRemaining = 0;
  let totalOutstanding = 0;

  type ActiveLoanSummary = {
    id: string;
    borrowerName: string;
    originalPrincipal: number;
    totalOutstanding: number;
  };

  const activeLoansList: ActiveLoanSummary[] = [];

  for (const loan of allLoans) {
    const originalPrincipal = Number(loan.principalAmount);
    totalPrincipalLent += originalPrincipal;

    const calc = getCalculatedLoanStatus(loan, calculationDate);

    if (calc.status === "ACTIVE") {
      activeLoansCount++;
      totalPrincipalRemaining += calc.remainingPrincipal;
      totalInterestRemaining += calc.remainingInterest;
      totalOutstanding += calc.totalOutstanding;

      activeLoansList.push({
        id: loan.id,
        borrowerName: loan.borrower.fullName,
        originalPrincipal,
        totalOutstanding: calc.totalOutstanding,
      });
    } else {
      closedLoansCount++;
    }
  }

  // Sort active loans by outstanding descending, take top 5
  activeLoansList.sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  const topActiveLoans = activeLoansList.slice(0, 5);

  // 3. Fetch latest 5 payments
  const recentPayments = await prisma.payment.findMany({
    take: 5,
    orderBy: {
      paymentDate: "desc",
    },
    include: {
      borrower: {
        select: {
          fullName: true,
          phone: true,
        },
      },
      allocations: true,
    },
  });

  const formattedRecentPayments = recentPayments.map((payment) => {
    let interestPaid = 0;
    let principalPaid = 0;

    payment.allocations.forEach((alloc) => {
      interestPaid += Number(alloc.interestAmount);
      principalPaid += Number(alloc.principalAmount);
    });

    return {
      id: payment.id,
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate,
      status: payment.status,
      borrowerName: payment.borrower.fullName,
      borrowerPhone: payment.borrower.phone,
      interestPaid,
      principalPaid,
    };
  });

  return {
    overview: {
      totalBorrowers,
      totalPrincipalLent,
      totalReceived,
      totalOutstanding,
      principalRemaining: totalPrincipalRemaining,
      interestRemaining: totalInterestRemaining,
      activeLoansCount,
      closedLoansCount,
    },
    topActiveLoans,
    recentPayments: formattedRecentPayments,
  };
}
