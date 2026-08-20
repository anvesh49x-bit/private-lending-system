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

    const hasLoans = borrower._count.loans > 0;
    const hasPayments = borrower._count.payments > 0;

    if (hasLoans && hasPayments) {
      return NextResponse.json({ success: false, message: "Cannot delete this borrower because loan and payment records exist." }, { status: 409 });
    } else if (hasLoans) {
      return NextResponse.json({ success: false, message: "Cannot delete this borrower because loan records exist. Delete eligible loans first." }, { status: 409 });
    } else if (hasPayments) {
      return NextResponse.json({ success: false, message: "Cannot delete this borrower because payment history exists." }, { status: 409 });
    }

    await prisma.borrower.delete({
      where: { id }
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