// src/lib/utils/orderUtils.ts
export function isWithinOrderWindow(): { allowed: boolean; message: string } {
    const now = new Date()
    const hour = now.getHours()
    const minutes = now.getMinutes()
    const currentTime = hour + minutes / 60
  
    // Check if it's after 3 PM (15:00)
    if (currentTime >= 15) {
      return {
        allowed: false,
        message: "Orders are closed for today. Please place your order before 3:00 PM for next business day delivery."
      }
    }
  
    return {
      allowed: true,
      message: "Your order will be delivered next business day."
    }
  }
  
  export function getNextBusinessDay(): Date {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
  
    // Skip weekends
    while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
      tomorrow.setDate(tomorrow.getDate() + 1)
    }
  
    return tomorrow
  }