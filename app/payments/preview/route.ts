import { NextResponse } from "next/server";

import { createPayment } from "@/lib/services/payment.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const borrowerId = String(
      body.borrowerId || ""
    );

    const loanId = String(
      body.loanId || ""
    );

    const amount = Number(
      body.amount
    );

    const paymentDate = body.paymentDate
      ? new Date(body.paymentDate)
      : new Date();

    const notes =
      body.notes === null ||
      body.notes === undefined
        ? undefined
        : String(body.notes);

    if (!borrowerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Borrower ID is required.",
        },
        { status: 400 }
      );
    }

    if (!loanId) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment amount must be greater than zero.",
        },
        { status: 400 }
      );
    }

    if (
      Number.isNaN(
        paymentDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment date.",
        },
        { status: 400 }
      );
    }

    const result = await createPayment({
      borrowerId,
      loanId,
      amount,
      paymentDate,
      notes,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Payment recorded successfully.",
        data: {
          payment: result.payment,
          allocation: {
            paymentAmount:
              result.allocation.paymentAmount,

            interestPaid:
              result.allocation.interestPaid,

            principalPaid:
              result.allocation.principalPaid,

            excessAmount:
              result.allocation.excessAmount,

            remainingPrincipal:
              result.allocation.remainingPrincipal,

            remainingInterest:
              result.allocation.remainingInterest,

            totalRemaining:
              result.allocation.totalRemaining,

            periodStart:
              result.allocation.periodStart.toISOString(),

            periodEnd:
              result.allocation.periodEnd.toISOString(),
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to create payment:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to record payment.",
      },
      { status: 500 }
    );
  }
}
