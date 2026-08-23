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
        reminders: true,
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
  let interestIncomeCollected = 0;
  let principalRecovered = 0;
  allLoans.forEach(loan => {
    loan.allocations.forEach(alloc => {
      interestIncomeCollected += Number(alloc.interestAmount);
      principalRecovered += Number(alloc.principalAmount);
    });
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
      principalRecovered,
      interestIncomeCollected,
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
    },
    automatedReminders: (() => {
      const pendingReminders: any[] = [];
      summaries.forEach(s => {
        if (s.status === "ACTIVE" && s.loan.reminders) {
          s.loan.reminders.forEach((r: any) => {
            if (r.status === "PENDING" || r.status === "PROCESSING") {
              pendingReminders.push({
                id: r.id,
                loanId: s.loan.id,
                borrowerName: s.loan.borrower.fullName,
                scheduledDate: r.scheduledDate,
                mode: r.type,
                status: r.status,
              });
            }
          });
        }
      });
      return pendingReminders.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    })(),
    remindersSummary: (() => {
      let sentToday = 0;
      let pendingCount = 0;
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      summaries.forEach(s => {
        if (s.loan.reminders) {
          s.loan.reminders.forEach((r: any) => {
            if (r.status === "PENDING" || r.status === "PROCESSING") {
              pendingCount++;
            } else if (r.status === "SENT" && r.sentAt) {
              const sentAt = new Date(r.sentAt);
              if (sentAt >= todayStart) {
                sentToday++;
              }
            }
          });
        }
      });
      return { sentToday, pendingCount };
    })(),
    collectionReminders: (() => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const reminders = summaries
        .filter(s => s.status === "ACTIVE" && s.loan.collectionReminderDate)
        .map(s => {
          const reminderDate = new Date(s.loan.collectionReminderDate!);
          const reminderDateStart = new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());
          
          const timeDiff = reminderDateStart.getTime() - todayStart.getTime();
          const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));
          
          let status = "UPCOMING";
          if (daysDiff < 0) status = "OVERDUE";
          else if (daysDiff === 0) status = "TODAY";
          
          return {
            loanId: s.loan.id,
            borrowerName: s.loan.borrower.fullName,
            totalOutstanding: s.totalOutstanding,
            reminderDate: reminderDate,
            daysDiff: daysDiff,
            status: status
          };
        })
        .sort((a, b) => {
          if (a.status !== b.status) {
            const order = { OVERDUE: 1, TODAY: 2, UPCOMING: 3 };
            return order[a.status as keyof typeof order] - order[b.status as keyof typeof order];
          }
          return a.daysDiff - b.daysDiff;
        });

      return {
        all: reminders,
        overdueCount: reminders.filter(r => r.status === "OVERDUE").length,
        todayCount: reminders.filter(r => r.status === "TODAY").length,
        upcomingCount: reminders.filter(r => r.status === "UPCOMING").length,
      };
    })()
  };
}
