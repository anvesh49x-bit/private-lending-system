import { getCalculatedLoanStatus } from "./payment.service";

export type PortfolioLoanSummary = {
  loan: any; 
  originalPrincipal: number;
  totalOutstanding: number;
  remainingPrincipal: number;
  remainingInterest: number;
  status: string;
  alertStatus: "OVERDUE" | "DUE_SOON" | null;
  daysDiff: number;
};

export function getPortfolioSummary(allLoans: any[], calculationDate: Date = new Date()) {
  let totalPrincipalLent = 0;
  let activeLoansCount = 0;
  let closedLoansCount = 0;
  let totalPrincipalRemaining = 0;
  let totalInterestRemaining = 0;
  let totalOutstanding = 0;
  
  let overdueCount = 0;
  let dueSoonCount = 0;
  let overdueAmount = 0;
  let dueSoonAmount = 0;

  const nowMs = new Date(calculationDate.getFullYear(), calculationDate.getMonth(), calculationDate.getDate()).getTime();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const summaries: PortfolioLoanSummary[] = [];

  for (const loan of allLoans) {
    const originalPrincipal = Number(loan.principalAmount);
    totalPrincipalLent += originalPrincipal;

    const calc = getCalculatedLoanStatus(loan, calculationDate);

    let alertStatus: "OVERDUE" | "DUE_SOON" | null = null;
    let daysDiff = 0;

    if (calc.status === "ACTIVE") {
      activeLoansCount++;
      totalPrincipalRemaining += calc.remainingPrincipal;
      totalInterestRemaining += calc.remainingInterest;
      totalOutstanding += calc.totalOutstanding;

      if (loan.endDate && calc.totalOutstanding > 0) {
        const endDateMs = new Date(loan.endDate.getFullYear(), loan.endDate.getMonth(), loan.endDate.getDate()).getTime();
        daysDiff = Math.floor((endDateMs - nowMs) / MS_PER_DAY);
        
        if (daysDiff < 0) {
          alertStatus = "OVERDUE";
          overdueCount++;
          overdueAmount += calc.totalOutstanding;
        } else if (daysDiff <= 7) {
          alertStatus = "DUE_SOON";
          dueSoonCount++;
          dueSoonAmount += calc.totalOutstanding;
        }
      }
    } else {
      closedLoansCount++;
    }

    summaries.push({
      loan,
      originalPrincipal,
      totalOutstanding: calc.totalOutstanding,
      remainingPrincipal: calc.remainingPrincipal,
      remainingInterest: calc.remainingInterest,
      status: calc.status,
      alertStatus,
      daysDiff
    });
  }

  return {
    summaries,
    metrics: {
      totalPrincipalLent,
      activeLoansCount,
      closedLoansCount,
      totalPrincipalRemaining,
      totalInterestRemaining,
      totalOutstanding,
      overdueCount,
      dueSoonCount,
      overdueAmount,
      dueSoonAmount
    }
  };
}
