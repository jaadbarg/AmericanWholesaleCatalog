// src/components/profile/PasswordStrengthIndicator.tsx
'use client'

type PasswordStrengthProps = {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthProps) {
  // Empty passwords should not show a strength indicator
  if (!password) {
    return null
  }

  // Calculate password strength
  const getStrength = (password: string): { score: number; text: string; color: string } => {
    let score = 0
    
    // Length check
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    
    // Character variety checks
    if (/[A-Z]/.test(password)) score += 1 // Has uppercase
    if (/[a-z]/.test(password)) score += 1 // Has lowercase
    if (/[0-9]/.test(password)) score += 1 // Has number
    if (/[^A-Za-z0-9]/.test(password)) score += 1 // Has special character
    
    // Determine strength category
    if (score <= 2) {
      return { score, text: 'Weak', color: 'bg-red-500' }
    } else if (score <= 4) {
      return { score, text: 'Good', color: 'bg-yellow-500' }
    } else {
      return { score, text: 'Strong', color: 'bg-green-500' }
    }
  }

  const strength = getStrength(password)
  const maxScore = 6
  const strengthPercent = (strength.score / maxScore) * 100

  return (
    <div className="mt-1">
      <div className="flex items-center space-x-2">
        <div className="h-2 flex-grow bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${strength.color}`} 
            style={{ width: `${strengthPercent}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-500">
          {strength.text}
        </span>
      </div>
    </div>
  )
}