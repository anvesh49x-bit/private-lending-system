import { NextResponse } from "next/server";
import { createPayment } from "@/lib/services/payment.service";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const borrowerId = searchParams.get("borrowerId");

    const where = borrowerId ? { borrowerId } : {};

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      include: {
        borrower: true,
        allocations: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: payments,
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { borrowerId, loanId, amount, paymentDate, notes } = body;

    if (!borrowerId || !loanId || amount === undefined || amount === null) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await createPayment({
      borrowerId,
      loanId,
      amount: Number(amount),
      paymentDate: paymentDate ? new Date(paymentDate) : undefined,
      notes,
    });

    return NextResponse.json({
      success: true,
      data: result,
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
