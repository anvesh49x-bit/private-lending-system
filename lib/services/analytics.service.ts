import { prisma } from "@/lib/db/prisma";

import { getPortfolioSummary } from "./portfolio.service";

export type TimeRange = "ALL_TIME" | "THIS_MONTH" | "THIS_YEAR";

export async function getBusinessAnalytics(options?: { timeRange?: TimeRange }) {
  const timeRange = options?.timeRange || "ALL_TIME";

  // Date filtering for payments
  const now = new Date();
  let startDate: Date | undefined;

  if (timeRange === "THIS_MONTH") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (timeRange === "THIS_YEAR") {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  // Fetch all loans and all payments in parallel
  const [allLoans, allPayments] = await Promise.all([
    prisma.loan.findMany({
      include: {
        borrower: true,
        allocations: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.payment.findMany({
      where: { status: "COMPLETED" },
      include: { allocations: true },
    })
  ]);

  // Calculate current portfolio positions using the unified service
  const portfolio = getPortfolioSummary(allLoans, now);
  const { metrics, summaries } = portfolio;
  
  const totalCapitalLent = metrics.totalPrincipalLent;
  const capitalOutstanding = metrics.totalPrincipalRemaining;
  const interestReceivable = metrics.totalInterestRemaining;
  const totalOutstanding = metrics.totalOutstanding;

  // Top outstanding loans
  const topOutstandingLoans = summaries
    .map((s) => ({
      id: s.loan.id,
      borrowerName: s.loan.borrower.fullName,
      originalPrincipal: s.originalPrincipal,
      principalRemaining: s.remainingPrincipal,
      interestRemaining: s.remainingInterest,
      totalOutstanding: s.totalOutstanding,
      status: s.status,
    }))
    .sort((a, b) => b.totalOutstanding - a.totalOutstanding)
    .slice(0, 5);

  // Removed old payment processing in favor of the unified allPayments logic below

  // 3. Overall Interest Income Collected (All-time, needed for Interest Performance section)
  // Wait, if timeRange is THIS_MONTH, should Interest Income Collected in "Section 3" be all-time or time-filtered?
  // The prompt says: "Use the selected time range for: payments received, principal recovered, interest collected, payment count."
  // So interest collected uses time range. But wait, "Interest Yet To Collect = max(0, Interest Accrued - Interest Income Collected)".
  // If Interest Income Collected is time filtered, but Interest Accrued is all-time, then Interest Yet To Collect will be wrong!
  // Therefore, we need an all-time interest collected for that formula, OR both must be all-time.
  // Actually, I'll calculate all-time recoveries separately just for those formulas.
  let allTimeInterestCollected = 0;
  let allTimePrincipalRecovered = 0;
  
  allLoans.forEach((loan) => {
    loan.allocations.forEach((alloc) => {
      allTimeInterestCollected += Number(alloc.interestAmount);
      allTimePrincipalRecovered += Number(alloc.principalAmount);
    });
  });

  const principalRecoveryRate = totalCapitalLent > 0 ? (allTimePrincipalRecovered / totalCapitalLent) * 100 : 0;

  // Aggregate monthly data
  const monthlyData: Record<string, { periodStart: Date, period: string, capitalLent: number, principalRecovered: number, interestCollected: number }> = {};
  
  function getMonthKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  function formatMonthLabel(date: Date) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
  }

  // Aggregate loans by start date
  allLoans.forEach(loan => {
    const d = new Date(loan.startDate);
    const key = getMonthKey(d);
    if (!monthlyData[key]) {
      monthlyData[key] = { periodStart: new Date(d.getFullYear(), d.getMonth(), 1), period: formatMonthLabel(d), capitalLent: 0, principalRecovered: 0, interestCollected: 0 };
    }
    monthlyData[key].capitalLent += Number(loan.principalAmount);
  });

  allPayments.forEach(payment => {
    const d = new Date(payment.paymentDate);
    const key = getMonthKey(d);
    if (!monthlyData[key]) {
      monthlyData[key] = { periodStart: new Date(d.getFullYear(), d.getMonth(), 1), period: formatMonthLabel(d), capitalLent: 0, principalRecovered: 0, interestCollected: 0 };
    }
    payment.allocations.forEach(alloc => {
      monthlyData[key].principalRecovered += Number(alloc.principalAmount);
      monthlyData[key].interestCollected += Number(alloc.interestAmount);
    });
  });

  const sortedMonths = Object.values(monthlyData).sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());

  // Filter for charts
  const filteredMonths = startDate 
    ? sortedMonths.filter(m => m.periodStart.getTime() >= startDate!.getTime())
    : sortedMonths;

  // Key Metrics Time Filtered Variables
  let timeFilteredInterestCollected = 0;
  let timeFilteredTotalMoneyReceived = 0;
  
  const timeFilteredPayments = startDate ? allPayments.filter(p => new Date(p.paymentDate).getTime() >= startDate!.getTime()) : allPayments;
  
  timeFilteredPayments.forEach(payment => {
    timeFilteredTotalMoneyReceived += Number(payment.amount);
    payment.allocations.forEach(alloc => {
      timeFilteredInterestCollected += Number(alloc.interestAmount);
    });
  });

  return {
    overview: {
      totalCapitalLent,
      capitalOutstanding,
      interestIncomeCollected: timeFilteredInterestCollected,
      totalMoneyReceived: timeFilteredTotalMoneyReceived,
      allTimeInterestCollected
    },
    moneyFlow: filteredMonths.map(m => ({
      period: m.period,
      capitalLent: m.capitalLent,
      principalRecovered: m.principalRecovered,
      interestCollected: m.interestCollected
    })),
    monthlyCollections: filteredMonths.map(m => ({
      period: m.period,
      principalRecovered: m.principalRecovered,
      interestCollected: m.interestCollected
    })),
    capitalRecovery: {
      recovered: allTimePrincipalRecovered,
      outstanding: capitalOutstanding,
      recoveryRate: principalRecoveryRate
    },
    interestGrowth: filteredMonths.map(m => ({
      period: m.period,
      interestCollected: m.interestCollected
    })),
    portfolioComposition: {
      principalOutstanding: capitalOutstanding,
      interestReceivable,
      totalOutstanding
    },
    topOutstandingLoans
  };
}
