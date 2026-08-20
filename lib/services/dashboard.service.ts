import { prisma } from "@/lib/db/prisma";

import { getPortfolioSummary } from "./portfolio.service";

export async function getDashboardData() {
  const calculationDate = new Date();

  // Fetch all necessary data in parallel
  const [totalBorrowers, totalReceivedResult, allLoans, recentPayments] = await Promise.all([
    prisma.borrower.count(),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED" },
    }),
    prisma.loan.findMany({
      include: {
        borrower: {
          select: { fullName: true, phone: true },
        },
        allocations: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.payment.findMany({
      take: 5,
      orderBy: { paymentDate: "desc" },
      include: {
        borrower: { select: { fullName: true, phone: true } },
        allocations: true,
      },
    }),
  ]);

  const totalReceived = Number(totalReceivedResult._sum.amount || 0);
  
  // Calculate portfolio in one pass
  const portfolio = getPortfolioSummary(allLoans, calculationDate);
  const { metrics, summaries } = portfolio;

  // Filter for dashboard UI
  const activeLoansList = summaries
    .filter(s => s.status === "ACTIVE")
    .map(s => ({
      id: s.loan.id,
      borrowerName: s.loan.borrower.fullName,
      originalPrincipal: s.originalPrincipal,
      totalOutstanding: s.totalOutstanding,
    }))
    .sort((a, b) => b.totalOutstanding - a.totalOutstanding);
    
  const topActiveLoans = activeLoansList.slice(0, 5);

  // Extract alerts from summaries
  const overdueLoans = summaries
    .filter(s => s.alertStatus === "OVERDUE")
    .map(s => ({
      loanId: s.loan.id,
      borrowerId: s.loan.borrowerId,
      borrowerName: s.loan.borrower.fullName,
      endDate: s.loan.endDate!,
      daysOverdue: Math.abs(s.daysDiff),
      remainingPrincipal: s.remainingPrincipal,
      remainingInterest: s.remainingInterest,
      totalOutstanding: s.totalOutstanding,
    }))
    .sort((a, b) => b.totalOutstanding - a.totalOutstanding);

  const dueSoonLoans = summaries
    .filter(s => s.alertStatus === "DUE_SOON")
    .map(s => ({
      loanId: s.loan.id,
      borrowerId: s.loan.borrowerId,
      borrowerName: s.loan.borrower.fullName,
      endDate: s.loan.endDate!,
      daysUntilDue: s.daysDiff,
      remainingPrincipal: s.remainingPrincipal,
      remainingInterest: s.remainingInterest,
      totalOutstanding: s.totalOutstanding,
    }))
    .sort((a, b) => (a.daysUntilDue || 0) - (b.daysUntilDue || 0) || b.totalOutstanding - a.totalOutstanding);

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
      totalPrincipalLent: metrics.totalPrincipalLent,
      totalReceived,
      totalOutstanding: metrics.totalOutstanding,
      principalRemaining: metrics.totalPrincipalRemaining,
      interestRemaining: metrics.totalInterestRemaining,
      activeLoansCount: metrics.activeLoansCount,
      closedLoansCount: metrics.closedLoansCount,
    },
    topActiveLoans,
    recentPayments: formattedRecentPayments,
    alerts: {
      overdueLoans,
      dueSoonLoans,
      overdueCount: metrics.overdueCount,
      dueSoonCount: metrics.dueSoonCount,
      overdueAmount: metrics.overdueAmount,
      dueSoonAmount: metrics.dueSoonAmount,
    }
  };
}
