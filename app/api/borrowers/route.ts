import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getBorrowers } from "@/lib/services/borrower.service";

export async function GET() {
  try {
    const borrowers = await getBorrowers();

    return NextResponse.json({
      success: true,
      data: borrowers,
    });
  } catch (error) {
    console.error("Failed to get borrowers:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to get borrowers",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      fullName,
      phone,
      address,
      principalAmount,
      interestFrequency,
      interestValueType,
      interestRate,
      startDate,
    } = body;

    // Required fields
    if (
      !fullName?.trim() ||
      !phone?.trim() ||
      principalAmount === undefined ||
      principalAmount === null ||
      !interestFrequency ||
      !interestValueType ||
      interestRate === undefined ||
      interestRate === null ||
      !startDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fill in all required borrower and loan details.",
        },
        { status: 400 }
      );
    }

    const principal = Number(principalAmount);
    const interest = Number(interestRate);

    // Validate principal
    if (!Number.isFinite(principal) || principal <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Principal amount must be greater than ₹0.",
        },
        { status: 400 }
      );
    }

    // Validate interest
    if (!Number.isFinite(interest) || interest < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Interest must be a valid positive number.",
        },
        { status: 400 }
      );
    }

    // Validate frequency
    const validFrequencies = [
      "MONTHLY",
      "CUSTOM_DATE_RANGE",
    ];

    if (!validFrequencies.includes(interestFrequency)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid interest frequency.",
        },
        { status: 400 }
      );
    }

    // Validate value type
    const validValueTypes = ["PERCENTAGE", "RUPEES"];

    if (!validValueTypes.includes(interestValueType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid interest value type.",
        },
        { status: 400 }
      );
    }

    // Validate start date
    const parsedStartDate = new Date(startDate);

    if (Number.isNaN(parsedStartDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid loan start date.",
        },
        { status: 400 }
      );
    }

    // Create borrower and first loan together
    const borrower = await prisma.borrower.create({
      data: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address?.trim() || null,

        loans: {
          create: {
            principalAmount: principal,
            interestFrequency,
            interestValueType,
            interestRate: interest,
            startDate: parsedStartDate,
          },
        },
      },

      include: {
        loans: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Borrower and loan created successfully.",
        data: borrower,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create borrower and loan:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create borrower. The phone number may already exist.",
      },
      { status: 500 }
    );
  }
}