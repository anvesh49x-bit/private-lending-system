import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        allocations: true,
      },
    });

    if (!loan) {
      return NextResponse.json({ success: false, message: "Loan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: loan });
  } catch (error) {
    console.error("Failed to fetch loan:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      principalAmount,
      interestFrequency,
      interestValueType,
      interestRate,
      startDate,
      endDate,
      collectionReminderDate,
    } = body;

    if (interestFrequency === "CUSTOM_DATE_RANGE" && !endDate) {
      return NextResponse.json({ success: false, message: "End date is required for custom date range loans" }, { status: 400 });
    }

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        allocations: true,
      },
    });

    if (!loan) {
      return NextResponse.json({ success: false, message: "Loan not found" }, { status: 404 });
    }

    const hasPayments = loan.allocations.length > 0;

    if (hasPayments) {
      // Check if protected fields are being modified
      const isPrincipalChanged = principalAmount !== undefined && Number(principalAmount) !== Number(loan.principalAmount);
      const isInterestFrequencyChanged = interestFrequency !== undefined && interestFrequency !== loan.interestFrequency;
      const isInterestValueTypeChanged = interestValueType !== undefined && interestValueType !== loan.interestValueType;
      const isInterestRateChanged = interestRate !== undefined && Number(interestRate) !== Number(loan.interestRate);
      
      const incomingStartDate = startDate ? new Date(startDate).toISOString().split('T')[0] : null;
      const existingStartDate = loan.startDate.toISOString().split('T')[0];
      const isStartDateChanged = startDate !== undefined && incomingStartDate !== existingStartDate;

      if (isPrincipalChanged || isInterestFrequencyChanged || isInterestValueTypeChanged || isInterestRateChanged || isStartDateChanged) {
        return NextResponse.json(
          {
            success: false,
            message: "Cannot modify financial terms of a loan that has existing payment allocations.",
          },
          { status: 403 }
        );
      }
    }

    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: {
        ...(!hasPayments && principalAmount !== undefined && { principalAmount: Number(principalAmount) }),
        ...(!hasPayments && interestFrequency !== undefined && { interestFrequency }),
        ...(!hasPayments && interestValueType !== undefined && { interestValueType }),
        ...(!hasPayments && interestRate !== undefined && { interestRate: Number(interestRate) }),
        ...(!hasPayments && startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(collectionReminderDate !== undefined && { collectionReminderDate: collectionReminderDate ? new Date(collectionReminderDate) : null }),
      },
    });

    return NextResponse.json({ success: true, data: updatedLoan });
  } catch (error) {
    console.error("Failed to update loan:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        allocations: true,
      },
    });

    if (!loan) {
      return NextResponse.json({ success: false, message: "Loan not found" }, { status: 404 });
    }

    const paymentIds = loan.allocations.map(a => a.paymentId);

    if (paymentIds.length > 0) {
      const otherAllocations = await prisma.paymentAllocation.findMany({
        where: {
          paymentId: { in: paymentIds },
          loanId: { not: id }
        }
      });

      if (otherAllocations.length > 0) {
        return NextResponse.json(
          { success: false, message: "This loan cannot be deleted because it shares payments with other loans." },
          { status: 409 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      if (paymentIds.length > 0) {
        // Delete excess balances associated with these payments
        await tx.excessBalance.deleteMany({
          where: { paymentId: { in: paymentIds } }
        });
        
        // Delete allocations
        await tx.paymentAllocation.deleteMany({
          where: { paymentId: { in: paymentIds } }
        });
        
        // Delete payments
        await tx.payment.deleteMany({
          where: { id: { in: paymentIds } }
        });
      }

      await tx.loan.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: "Loan deleted successfully" });
  } catch (error) {
    console.error("Failed to delete loan:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
