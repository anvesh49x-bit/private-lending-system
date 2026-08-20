import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getLoanOutstanding } from "@/lib/services/payment.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        borrower: true,
        allocations: {
          include: {
            loan: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment not found" },
        { status: 404 }
      );
    }

    const loanDetails = await Promise.all(
      payment.allocations.map(async (allocation) => {
        // Calculate outstanding as of the payment date
        const outstanding = await getLoanOutstanding(
          allocation.loanId,
          payment.paymentDate
        );
        return {
          allocation,
          loan: allocation.loan,
          outstanding,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        payment,
        loanDetails,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
