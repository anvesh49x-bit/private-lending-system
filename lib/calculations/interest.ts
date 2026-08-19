export type InterestFrequency =
  | "MONTHLY"
  | "YEARLY"
  | "CUSTOM_DATE_RANGE";

export type InterestValueType =
  | "PERCENTAGE"
  | "RUPEES";

type CalculateInterestInput = {
  principalAmount: number;
  interestRate: number;
  interestFrequency: InterestFrequency;
  interestValueType: InterestValueType;
  startDate: Date | string;
  endDate?: Date | string | null;
  calculationDate?: Date;
};

export type InterestCalculation = {
  daysElapsed: number;
  estimatedInterest: number;
  totalDue: number;
};

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

function getDaysBetween(startDate: Date, endDate: Date) {
  const start = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );

  const end = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );

  return Math.max(
    0,
    Math.floor(
      (end.getTime() - start.getTime()) / MILLISECONDS_PER_DAY
    )
  );
}

/*
 * Indian "rupees interest" style:
 *
 * ₹2 interest per ₹100 principal
 *
 * Example:
 * Principal = ₹20,000
 * Rate = ₹2
 *
 * Interest for one complete period:
 *
 * (20,000 / 100) × 2 = ₹400
 *
 * NOT ₹2 total.
 */
function getInterestForOnePeriod({
  principalAmount,
  interestRate,
  interestValueType,
}: {
  principalAmount: number;
  interestRate: number;
  interestValueType: InterestValueType;
}) {
  if (
    !Number.isFinite(principalAmount) ||
    !Number.isFinite(interestRate) ||
    principalAmount <= 0 ||
    interestRate <= 0
  ) {
    return 0;
  }

  if (interestValueType === "RUPEES") {
    return (principalAmount / 100) * interestRate;
  }

  if (interestValueType === "PERCENTAGE") {
    return principalAmount * (interestRate / 100);
  }

  return 0;
}

export function calculateEstimatedInterest({
  principalAmount,
  interestRate,
  interestFrequency,
  interestValueType,
  startDate,
  endDate,
  calculationDate = new Date(),
}: CalculateInterestInput): InterestCalculation {
  const principal = Number(principalAmount);
  const rate = Number(interestRate);

  if (
    !Number.isFinite(principal) ||
    !Number.isFinite(rate) ||
    principal <= 0 ||
    rate < 0
  ) {
    return {
      daysElapsed: 0,
      estimatedInterest: 0,
      totalDue: Math.max(0, principal || 0),
    };
  }

  const start = new Date(startDate);

  if (Number.isNaN(start.getTime())) {
    return {
      daysElapsed: 0,
      estimatedInterest: 0,
      totalDue: principal,
    };
  }

  /*
   * If endDate is null:
   * calculate from start date until today.
   *
   * If endDate exists:
   * never calculate beyond that configured end date.
   */
  let calculationEnd = new Date(calculationDate);

  if (endDate) {
    const configuredEnd = new Date(endDate);

    if (
      !Number.isNaN(configuredEnd.getTime()) &&
      configuredEnd.getTime() < calculationEnd.getTime()
    ) {
      calculationEnd = configuredEnd;
    }
  }

  const daysElapsed = getDaysBetween(start, calculationEnd);

  if (daysElapsed <= 0) {
    return {
      daysElapsed: 0,
      estimatedInterest: 0,
      totalDue: principal,
    };
  }

  const interestForOnePeriod = getInterestForOnePeriod({
    principalAmount: principal,
    interestRate: rate,
    interestValueType,
  });

  let estimatedInterest = 0;

  /*
   * MONTHLY
   *
   * ₹2 per ₹100 per month.
   *
   * ₹20,000 at ₹2 per ₹100:
   * One month = ₹400 interest.
   */
  if (interestFrequency === "MONTHLY") {
    const monthsElapsed = daysElapsed / 30;

    estimatedInterest =
      interestForOnePeriod * monthsElapsed;
  }

  /*
   * YEARLY
   *
   * ₹2 per ₹100 per year.
   *
   * ₹20,000 at ₹2 per ₹100:
   * One year = ₹400 interest.
   */
  if (interestFrequency === "YEARLY") {
    const yearsElapsed = daysElapsed / 365;

    estimatedInterest =
      interestForOnePeriod * yearsElapsed;
  }

  /*
   * CUSTOM_DATE_RANGE
   *
   * The configured custom date range itself is ONE interest period.
   *
   * Example:
   *
   * Principal = ₹20,000
   * Rate = ₹2 per ₹100
   *
   * Interest for that custom period = ₹400
   *
   * This is why the same ₹2 rule can correctly produce ₹400
   * for the selected custom period.
   */
  if (interestFrequency === "CUSTOM_DATE_RANGE") {
    estimatedInterest = interestForOnePeriod;
  }

  estimatedInterest = Number(
    Math.max(0, estimatedInterest).toFixed(2)
  );

  return {
    daysElapsed,
    estimatedInterest,
    totalDue: Number(
      (principal + estimatedInterest).toFixed(2)
    ),
  };
}