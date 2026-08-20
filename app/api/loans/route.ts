import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      borrowerId,
      principalAmount,
      interestFrequency,
      interestValueType,
      interestRate,
      startDate,
      endDate,
      collectionReminderDate,
    } = body;

    if (!borrowerId) {
      return NextResponse.json({ error: "Borrower ID is required" }, { status: 400 });
    }

    if (!principalAmount || Number(principalAmount) <= 0) {
      return NextResponse.json({ error: "Principal amount must be greater than 0" }, { status: 400 });
    }

    if (!interestRate || Number(interestRate) < 0) {
      return NextResponse.json({ error: "Valid interest rate is required" }, { status: 400 });
    }

    if (!startDate) {
      return NextResponse.json({ error: "Start date is required" }, { status: 400 });
    }

    if (interestFrequency === "CUSTOM_DATE_RANGE" && !endDate) {
      return NextResponse.json({ error: "End date is required for custom date range loans" }, { status: 400 });
    }

    const loan = await prisma.loan.create({
      data: {
        borrowerId,
        principalAmount: Number(principalAmount),
        interestFrequency,
        interestValueType,
        interestRate: Number(interestRate),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        collectionReminderDate: collectionReminderDate ? new Date(collectionReminderDate) : null,
      },
    });

    return NextResponse.json({ success: true, loan }, { status: 201 });
  } catch (error) {
    console.error("Error creating loan:", error);
    return NextResponse.json(
      { error: "Failed to create loan" },
      { status: 500 }
    );
  }
}
