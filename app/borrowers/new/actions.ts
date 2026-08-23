"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";

export async function createBorrowerWithLoan(
  formData: FormData
) {
  const fullName = String(
    formData.get("fullName") || ""
  ).trim();

  const phone = String(
    formData.get("phone") || ""
  ).trim();

  const addressValue = String(
    formData.get("address") || ""
  ).trim();

  const principalAmount = Number(
    formData.get("principalAmount")
  );

  const interestFrequency = String(
    formData.get("interestFrequency")
  );

  const interestValueType = String(
    formData.get("interestValueType")
  );

  const interestRate = Number(
    formData.get("interestRate")
  );

  const startDateValue = String(
    formData.get("startDate") || ""
  );

  const endDateValue = String(
    formData.get("endDate") || ""
  );

  const collectionReminderDateValue = String(
    formData.get("collectionReminderDate") || ""
  );

  if (!fullName || !phone) {
    return {
      error: "Borrower name and phone number are required."
    };
  }

  if (
    !Number.isFinite(principalAmount) ||
    principalAmount <= 0
  ) {
    return {
      error: "Principal amount must be greater than zero."
    };
  }

  if (
    !Number.isFinite(interestRate) ||
    interestRate < 0
  ) {
    return {
      error: "Enter a valid interest rate."
    };
  }

  if (!startDateValue) {
    return {
      error: "Loan start date is required."
    };
  }

  if (interestFrequency === "CUSTOM_DATE_RANGE" && !endDateValue) {
    return { error: "End date is required for custom date range loans." };
  }

  let borrower;
  try {
    borrower = await prisma.borrower.create({
      data: {
        fullName,
        phone,
        address: addressValue || null,

        loans: {
          create: {
            principalAmount,
            interestRate,

            interestFrequency:
              interestFrequency as
                | "MONTHLY"
                | "CUSTOM_DATE_RANGE",

            interestValueType:
              interestValueType as
                | "PERCENTAGE"
                | "RUPEES",

            startDate: new Date(
              `${startDateValue}T00:00:00`
            ),

            endDate: endDateValue
              ? new Date(
                  `${endDateValue}T00:00:00`
                )
              : null,
            collectionReminderDate: collectionReminderDateValue
              ? new Date(
                  `${collectionReminderDateValue}T00:00:00`
                )
              : null,
          },
        },
      },
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { error: `A borrower with the phone number ${phone} already exists.` };
    }
    console.error("Database error creating borrower:", error);
    return { error: "An unexpected error occurred while saving to the database." };
  }

  redirect(`/borrowers/${borrower.id}`);
}
