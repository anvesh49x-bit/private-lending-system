import {
  calculatePaymentAllocation,
  getLoanOutstanding,
} from "@/lib/services/payment.service";

async function main() {
  const loanId = process.argv[2];

  if (!loanId) {
    throw new Error(
      "Usage: npx tsx payment_test.ts <LOAN_ID>"
    );
  }

  console.log("\n=== CURRENT OUTSTANDING ===\n");

  const before = await getLoanOutstanding(
    loanId
  );

  console.log(before);

  console.log(
    "\n=== PAYMENT ALLOCATION FOR ₹5,000 ===\n"
  );

  const allocation =
    await calculatePaymentAllocation(
      loanId,
      5000,
      new Date()
    );

  console.log(allocation);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});