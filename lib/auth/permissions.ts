import { auth, currentUser } from '@clerk/nextjs/server'

const adminEmailCandidates = [
  process.env.ADMIN_EMAILS,
  process.env.NEXT_PUBLIC_ADMIN_EMAILS,
  process.env.NEXT_PUBLIC_SUPER_ADMINS,
]

const ADMIN_EMAILS = new Set(
  adminEmailCandidates
    .filter(Boolean)
    .flatMap((value) => (value ? value.split(",") : []))
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
)

/**
 * Check if the current user is an admin
 * Uses Clerk's publicMetadata or email-based verification
 */
export async function userIsAdmin(): Promise<boolean> {
  const user = await currentUser()
  if (!user) return false
  
  // Check Clerk metadata for role
  if (user.publicMetadata?.role === 'admin') return true
  
  // Check email against env var
  const email = user.emailAddresses[0]?.emailAddress?.toLowerCase()
  return email ? ADMIN_EMAILS.has(email) : false
}

/**
 * Get the current user ID from Clerk
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}
