import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const borrower = await prisma.borrower.findUnique({
      where: {
        id,
      },
      include: {
        loans: {
          orderBy: {
            createdAt: "desc",
          },
        },
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
        },
      },
    });

    if (!borrower) {
      return NextResponse.json(
        {
          success: false,
          message: "Borrower not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: borrower,
    });
  } catch (error) {
    console.error("Failed to get borrower details:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to get borrower details",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { fullName, phone, address } = body;

    if (!fullName || !phone) {
      return NextResponse.json(
        { success: false, message: "Full Name and Phone are required" },
        { status: 400 }
      );
    }

    const existingBorrower = await prisma.borrower.findFirst({
      where: {
        phone,
        id: { not: id },
      },
    });

    if (existingBorrower) {
      return NextResponse.json(
        { success: false, message: "Phone number is already in use by another borrower" },
        { status: 400 }
      );
    }

    const updatedBorrower = await prisma.borrower.update({
      where: { id },
      data: {
        fullName,
        phone,
        address: address || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedBorrower,
    });
  } catch (error) {
    console.error("Failed to update borrower:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update borrower",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    
    const borrower = await prisma.borrower.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            loans: true,
            payments: true,
          }
        }
      }
    });

    if (!borrower) {
      return NextResponse.json({ success: false, message: "Borrower not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete excess balances
      await tx.excessBalance.deleteMany({
        where: { borrowerId: id }
      });

      // 2. Delete payment allocations (since payments and loans are being deleted, we must clear these first)
      // We can get all payments for this borrower and delete their allocations
      const payments = await tx.payment.findMany({
        where: { borrowerId: id },
        select: { id: true }
      });
      const paymentIds = payments.map(p => p.id);
      
      if (paymentIds.length > 0) {
        await tx.paymentAllocation.deleteMany({
          where: { paymentId: { in: paymentIds } }
        });
      }

      // 3. Delete payments
      await tx.payment.deleteMany({
        where: { borrowerId: id }
      });

      // 4. Delete loans
      await tx.loan.deleteMany({
        where: { borrowerId: id }
      });

      // 5. Delete the borrower
      await tx.borrower.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: "Borrower deleted successfully" });
  } catch (error) {
    console.error("Failed to delete borrower:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}