// src/lib/utils/orderUtils.ts

// US holidays (month is 0-indexed)
const US_HOLIDAYS = [
  { month: 0, day: 1, name: "New Year's Day" },               // Jan 1
  { month: 4, day: 27, name: "Memorial Day", isFlex: true },  // Last Monday in May (approximate)
  { month: 6, day: 4, name: "Independence Day" },             // Jul 4
  { month: 8, day: 4, name: "Labor Day", isFlex: true },      // First Monday in September (approximate)
  { month: 10, day: 24, name: "Thanksgiving", isFlex: true }, // Fourth Thursday in November (approximate)
  { month: 11, day: 25, name: "Christmas Day" },              // Dec 25
];

// Time constants
const ORDER_CUTOFF_HOUR = 15; // 3 PM

/**
 * Checks if current time is within the order window
 * Orders can always be placed, but next-day delivery is only available before 3 PM
 * @returns Object with allowed status and message
 */
export function isWithinOrderWindow(): { allowed: boolean; message: string; canScheduleNextDay: boolean } {
  // Get current time in the company's timezone
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hour + minutes / 60;
  
  // Check if it's a weekend
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  
  // Check if it's a holiday
  const isHoliday = isPublicHoliday(now);
  
  // Check if it's after the cutoff time (3 PM)
  const afterCutoff = currentTime >= ORDER_CUTOFF_HOUR;
  
  // Calculate when the next possible delivery day will be
  const nextBusinessDay = getNextBusinessDay();
  const formattedNextDay = nextBusinessDay.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // For orders after cutoff, calculate the day after next business day
  const dayAfterNextBusinessDay = new Date(nextBusinessDay);
  dayAfterNextBusinessDay.setDate(dayAfterNextBusinessDay.getDate() + 1);
  
  // Find the next business day after that (skipping weekends/holidays)
  while (
    dayAfterNextBusinessDay.getDay() === 0 || // Sunday
    dayAfterNextBusinessDay.getDay() === 6 || // Saturday
    isPublicHoliday(dayAfterNextBusinessDay)  // Holiday
  ) {
    dayAfterNextBusinessDay.setDate(dayAfterNextBusinessDay.getDate() + 1);
  }
  
  const formattedDayAfterNext = dayAfterNextBusinessDay.toLocaleDateString('en-US', {
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
  
  // If weekend or holiday, we can still place orders but delivery will be delayed
  if (isWeekend || isHoliday) {
    return {
      allowed: true,
      canScheduleNextDay: false,
      message: `Orders placed on weekends or holidays will be delivered on ${formattedNextDay} at the earliest.`
    };
  }
  
  // If after cutoff, we can still place orders but next-day delivery isn't available
  if (afterCutoff) {
    return {
      allowed: true,
      canScheduleNextDay: false,
      message: `It's after 3:00 PM. Orders placed now will be delivered on ${formattedDayAfterNext} at the earliest.`
    };
  }
  
  // Before cutoff on a business day - next day delivery is available
  return {
    allowed: true,
    canScheduleNextDay: true,
    message: `Order before 3:00 PM today for delivery on ${formattedNextDay}.`
  };
}

/**
 * Checks if a date is a public holiday
 * @param date Date to check
 * @returns True if it's a holiday
 */
export function isPublicHoliday(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();
  const year = date.getFullYear();
  
  // Check fixed holidays
  const fixedHoliday = US_HOLIDAYS.find(h => 
    !h.isFlex && h.month === month && h.day === day
  );
  
  if (fixedHoliday) return true;
  
  // Check floating holidays that need calculation
  // Memorial Day: Last Monday in May
  if (month === 4) {
    const lastMonday = getLastDayOfMonth(year, 4, 1); // 1 = Monday
    if (day === lastMonday.getDate()) return true;
  }
  
  // Labor Day: First Monday in September
  if (month === 8 && day <= 7) {
    const firstMonday = getFirstDayOfMonth(year, 8, 1); // 1 = Monday
    if (day === firstMonday.getDate()) return true;
  }
  
  // Thanksgiving: Fourth Thursday in November
  if (month === 10) {
    const fourthThursday = getNthDayOfMonth(year, 10, 4, 4); // 4 = Thursday, 4th occurrence
    if (day === fourthThursday.getDate()) return true;
  }
  
  return false;
}

/**
 * Gets the next business day (skipping weekends and holidays)
 * @returns Date object representing the next business day
 */
export function getNextBusinessDay(): Date {
  const today = new Date();
  const result = new Date(today);
  result.setDate(result.getDate() + 1);
  
  // Keep incrementing until we find a business day
  while (
    result.getDay() === 0 || // Sunday
    result.getDay() === 6 || // Saturday
    isPublicHoliday(result)  // Holiday
  ) {
    result.setDate(result.getDate() + 1);
  }
  
  return result;
}

/**
 * Gets valid business days for the next month
 * Useful for the delivery date picker to only show valid dates
 * @returns Array of valid business days
 */
export function getValidBusinessDays(daysAhead: number = 30): Date[] {
  const validDates = [];
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);
  
  // Start from tomorrow
  const current = new Date(startDate);
  current.setDate(current.getDate() + 1);
  
  // Loop through days and collect business days
  while (current <= endDate) {
    if (
      current.getDay() !== 0 && // Not Sunday
      current.getDay() !== 6 && // Not Saturday
      !isPublicHoliday(current) // Not a holiday
    ) {
      validDates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return validDates;
}

// Helper functions for holiday calculations
function getFirstDayOfMonth(year: number, month: number, dayOfWeek: number): Date {
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();
  
  // Calculate days to add to get to the desired day of week
  const daysToAdd = (dayOfWeek - firstDayOfWeek + 7) % 7;
  firstDay.setDate(1 + daysToAdd);
  
  return firstDay;
}

function getLastDayOfMonth(year: number, month: number, dayOfWeek: number): Date {
  // Get the last day of the month
  const lastDay = new Date(year, month + 1, 0);
  const lastDayOfWeek = lastDay.getDay();
  
  // Calculate days to subtract to get to the last occurrence of the desired day
  const daysToSubtract = (lastDayOfWeek - dayOfWeek + 7) % 7;
  lastDay.setDate(lastDay.getDate() - daysToSubtract);
  
  return lastDay;
}

function getNthDayOfMonth(year: number, month: number, n: number, dayOfWeek: number): Date {
  // Get the first occurrence of the day
  const firstOccurrence = getFirstDayOfMonth(year, month, dayOfWeek);
  
  // Add weeks to get to the nth occurrence
  const nthOccurrence = new Date(firstOccurrence);
  nthOccurrence.setDate(firstOccurrence.getDate() + (n - 1) * 7);
  
  return nthOccurrence;
}