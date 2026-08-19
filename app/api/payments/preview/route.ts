import { NextResponse } from "next/server";
import { calculatePaymentAllocation } from "@/lib/services/payment.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { loanId, amount, paymentDate } = body;

    if (!loanId || amount === undefined || amount === null) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const preview = await calculatePaymentAllocation(
      loanId,
      Number(amount),
      paymentDate ? new Date(paymentDate) : new Date()
    );

    return NextResponse.json({
      success: true,
      data: preview,
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
