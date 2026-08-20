import { prisma } from "@/lib/db/prisma";
import {
  calculateEstimatedInterest,
} from "@/lib/calculations/interest";

export type PaymentAllocationResult = {
  paymentAmount: number;
  interestPaid: number;
  principalPaid: number;
  excessAmount: number;
  remainingPrincipal: number;
  remainingInterest: number;
  totalRemaining: number;
  periodStart: Date;
  periodEnd: Date;
};

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

function startOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

async function getLoanWithAllocations(
  loanId: string
) {
  const loan = await prisma.loan.findUnique({
    where: {
      id: loanId,
    },
    include: {
      allocations: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!loan) {
    throw new Error("Loan not found.");
  }

  return loan;
}

function calculatePrincipalPaid(
  allocations: Array<{
    principalAmount: unknown;
  }>
): number {
  return roundMoney(
    allocations.reduce(
      (total, allocation) =>
        total +
        Number(allocation.principalAmount),
      0
    )
  );
}

function calculateInterestPaid(
  allocations: Array<{
    interestAmount: unknown;
  }>
): number {
  return roundMoney(
    allocations.reduce(
      (total, allocation) =>
        total +
        Number(allocation.interestAmount),
      0
    )
  );
}

/**
 * Find the date from which the current unpaid-interest
 * period should start.
 *
 * If no payment has ever allocated interest:
 *   Loan start date -> payment date
 *
 * Otherwise:
 *   Last interest-settlement period end -> payment date
 */
function getInterestPeriodStart(
  loanStartDate: Date,
  allocations: Array<{
    interestAmount: unknown;
    periodEnd: Date | null;
  }>
): Date {
  const interestAllocations =
    allocations.filter(
      (allocation) =>
        Number(allocation.interestAmount) > 0 &&
        allocation.periodEnd
    );

  if (interestAllocations.length === 0) {
    return startOfDay(loanStartDate);
  }

  const lastAllocation =
    interestAllocations[
      interestAllocations.length - 1
    ];

  return startOfDay(
    lastAllocation.periodEnd as Date
  );
}

/**
 * Calculate currently outstanding interest
 * only for the unpaid period.
 *
 * This prevents previously paid interest from
 * being counted again.
 */
function getCurrentOutstandingInterestFromData(
  loan: any,
  remainingPrincipal: number,
  calculationDate: Date
): {
  interestPeriodStart: Date;
  interestPeriodEnd: Date;
  accruedInterest: number;
} {
  const periodStart = getInterestPeriodStart(
    loan.startDate,
    loan.allocations
  );

  const periodEnd = startOfDay(
    calculationDate
  );

  if (
    periodEnd.getTime() <=
    periodStart.getTime()
  ) {
    return {
      interestPeriodStart: periodStart,
      interestPeriodEnd: periodEnd,
      accruedInterest: 0,
    };
  }

  const calculation =
    calculateEstimatedInterest({
      principalAmount: remainingPrincipal,
      interestRate: Number(
        loan.interestRate
      ),
      interestFrequency:
        loan.interestFrequency,
      interestValueType:
        loan.interestValueType,

      /*
       * IMPORTANT:
       *
       * Interest is calculated only for the
       * current unpaid period.
       */
      startDate: periodStart,
      endDate: loan.endDate,
      calculationDate: periodEnd,
    });

  return {
    interestPeriodStart: periodStart,
    interestPeriodEnd: periodEnd,
    accruedInterest: roundMoney(
      calculation.estimatedInterest
    ),
  };
}

export function calculateLoanOutstanding(
  loan: any,
  calculationDate: Date = new Date()
) {
  const originalPrincipal =
    Number(loan.principalAmount);

  const principalPaid =
    calculatePrincipalPaid(
      loan.allocations
    );

  const interestPaid =
    calculateInterestPaid(
      loan.allocations
    );

  const remainingPrincipal =
    roundMoney(
      Math.max(
        0,
        originalPrincipal -
          principalPaid
      )
    );

  if (remainingPrincipal <= 0) {
    return {
      originalPrincipal: roundMoney(
        originalPrincipal
      ),
      principalPaid,
      remainingPrincipal: 0,
      accruedInterest: 0,
      interestPaid,
      remainingInterest: 0,
      totalRemaining: 0,
      interestPeriodStart:
        startOfDay(
          loan.startDate
        ),
      interestPeriodEnd:
        startOfDay(calculationDate),
    };
  }

  const currentInterest =
    getCurrentOutstandingInterestFromData(
      loan,
      remainingPrincipal,
      calculationDate
    );

  /*
   * IMPORTANT:
   *
   * `interestPaid` contains historical interest
   * allocations, while `accruedInterest` here is
   * only the current unpaid period.
   *
   * Therefore we do NOT subtract all historical
   * interestPaid from the current period again.
   */
  const remainingInterest =
    roundMoney(
      currentInterest.accruedInterest
    );

  return {
    originalPrincipal:
      roundMoney(originalPrincipal),

    principalPaid,

    remainingPrincipal,

    accruedInterest:
      currentInterest.accruedInterest,

    interestPaid,

    remainingInterest,

    totalRemaining: roundMoney(
      remainingPrincipal +
        remainingInterest
    ),

    interestPeriodStart:
      currentInterest.interestPeriodStart,

    interestPeriodEnd:
      currentInterest.interestPeriodEnd,
  };
}

export async function getLoanOutstanding(
  loanId: string,
  calculationDate: Date = new Date()
) {
  const loan =
    await getLoanWithAllocations(
      loanId
    );

  return calculateLoanOutstanding(loan, calculationDate);
}

export function getCalculatedLoanStatus(loan: any, calculationDate: Date = new Date()) {
  const outstanding = calculateLoanOutstanding(loan, calculationDate);
  const isClosed = outstanding.remainingPrincipal <= 0 && outstanding.remainingInterest <= 0;
  
  return {
    status: isClosed ? "CLOSED" : "ACTIVE",
    remainingPrincipal: outstanding.remainingPrincipal,
    remainingInterest: outstanding.remainingInterest,
    totalOutstanding: outstanding.totalRemaining
  };
}

export async function calculatePaymentAllocation(
  loanId: string,
  paymentAmount: number,
  paymentDate: Date = new Date()
): Promise<PaymentAllocationResult> {
  if (
    !Number.isFinite(paymentAmount) ||
    paymentAmount <= 0
  ) {
    throw new Error(
      "Payment amount must be greater than zero."
    );
  }

  const actualPaymentDate =
    startOfDay(paymentDate);

  const outstanding =
    await getLoanOutstanding(
      loanId,
      actualPaymentDate
    );

  let remainingPayment =
    roundMoney(paymentAmount);

  /*
   * 1. INTEREST FIRST
   */
  const interestPaid =
    roundMoney(
      Math.min(
        remainingPayment,
        outstanding.remainingInterest
      )
    );

  remainingPayment =
    roundMoney(
      remainingPayment -
        interestPaid
    );

  /*
   * 2. PRINCIPAL SECOND
   */
  const principalPaid =
    roundMoney(
      Math.min(
        remainingPayment,
        outstanding.remainingPrincipal
      )
    );

  remainingPayment =
    roundMoney(
      remainingPayment -
        principalPaid
    );

  /*
   * 3. ANYTHING LEFT IS EXCESS
   */
  const excessAmount =
    roundMoney(
      remainingPayment
    );

  const remainingPrincipal =
    roundMoney(
      outstanding.remainingPrincipal -
        principalPaid
    );

  const remainingInterest =
    roundMoney(
      outstanding.remainingInterest -
        interestPaid
    );

  return {
    paymentAmount:
      roundMoney(paymentAmount),

    interestPaid,

    principalPaid,

    excessAmount,

    remainingPrincipal,

    remainingInterest,

    totalRemaining:
      roundMoney(
        remainingPrincipal +
          remainingInterest
      ),

    periodStart:
      outstanding.interestPeriodStart,

    periodEnd:
      actualPaymentDate,
  };
}

export async function createPayment({
  borrowerId,
  loanId,
  amount,
  paymentDate,
  notes,
}: {
  borrowerId: string;
  loanId: string;
  amount: number;
  paymentDate?: Date;
  notes?: string;
}) {
  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "Payment amount must be greater than zero."
    );
  }

  const actualPaymentDate =
    startOfDay(
      paymentDate ?? new Date()
    );

  const loan = await getLoanWithAllocations(loanId);

  const status = getCalculatedLoanStatus(loan, actualPaymentDate);
  if (status.status === "CLOSED") {
    throw new Error("This loan is already fully settled. No additional payment can be added.");
  }

  if (
    loan.borrowerId !==
    borrowerId
  ) {
    throw new Error(
      "This loan does not belong to the selected borrower."
    );
  }

  const allocation =
    await calculatePaymentAllocation(
      loanId,
      amount,
      actualPaymentDate
    );

  const result =
    await prisma.$transaction(
      async (tx) => {
        const payment =
          await tx.payment.create({
            data: {
              borrowerId,

              amount,

              paymentDate:
                actualPaymentDate,

              notes:
                notes?.trim() ||
                null,

              status:
                "COMPLETED",
            },
          });

        const allocatedAmount =
          roundMoney(
            allocation.interestPaid +
              allocation.principalPaid
          );

        if (allocatedAmount > 0) {
          await tx.paymentAllocation.create(
            {
              data: {
                paymentId:
                  payment.id,

                loanId,

                amount:
                  allocatedAmount,

                interestAmount:
                  allocation.interestPaid,

                principalAmount:
                  allocation.principalPaid,

                periodStart:
                  allocation.periodStart,

                periodEnd:
                  allocation.periodEnd,
              },
            }
          );
        }

        if (
          allocation.excessAmount >
          0
        ) {
          await tx.excessBalance.create({
            data: {
              borrowerId,

              paymentId:
                payment.id,

              amount:
                allocation.excessAmount,

              status:
                "AVAILABLE",
            },
          });
        }

        /*
         * Close the loan only when:
         *
         * Remaining principal = 0
         * AND
         * Remaining interest = 0
         *
         * Excess payment does not prevent closing.
         */
        if (
          allocation.remainingPrincipal <=
            0 &&
          allocation.remainingInterest <=
            0
        ) {
          await tx.loan.update({
            where: {
              id: loanId,
            },
            data: {
              status:
                "CLOSED",
            },
          });
        }

        return payment;
      }
    );

    return {
    payment: result,
    allocation,
  };
}

/**
 * Returns the payment history for a borrower.
 *
 * Each payment includes:
 * - total amount received
 * - interest paid
 * - principal paid
 * - excess amount
 * - allocation details
 */
export async function getPaymentHistory(
  borrowerId: string
) {
  const payments = await prisma.payment.findMany({
    where: {
      borrowerId,
    },

    orderBy: {
      paymentDate: "desc",
    },

    include: {
      allocations: {
        include: {
          loan: {
            select: {
              id: true,
              principalAmount: true,
              interestRate: true,
              interestFrequency: true,
              interestValueType: true,
            },
          },
        },
      },

      excesses: true,
    },
  });

  return payments.map((payment) => {
    const interestPaid = roundMoney(
      payment.allocations.reduce(
        (total, allocation) =>
          total +
          Number(allocation.interestAmount),
        0
      )
    );

    const principalPaid = roundMoney(
      payment.allocations.reduce(
        (total, allocation) =>
          total +
          Number(allocation.principalAmount),
        0
      )
    );

    const excessAmount = roundMoney(
      payment.excesses.reduce(
        (total, excess) =>
          total +
          Number(excess.amount),
        0
      )
    );

    return {
      id: payment.id,
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate,
      status: payment.status,
      notes: payment.notes,

      interestPaid,

      principalPaid,

      excessAmount,

      allocations: payment.allocations.map(
        (allocation) => ({
          id: allocation.id,
          loanId: allocation.loanId,

          amount: Number(
            allocation.amount
          ),

          interestAmount: Number(
            allocation.interestAmount
          ),

          principalAmount: Number(
            allocation.principalAmount
          ),

          periodStart:
            allocation.periodStart,

          periodEnd:
            allocation.periodEnd,
        })
      ),
    };
  });
}