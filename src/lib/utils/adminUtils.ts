// src/lib/utils/adminUtils.ts
export const ADMIN_EMAILS = ['admin@americanwholesale.com']

export function isAdmin(email: string | undefined): boolean {
  return ADMIN_EMAILS.includes(email || '')
}