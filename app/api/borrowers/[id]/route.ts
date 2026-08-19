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