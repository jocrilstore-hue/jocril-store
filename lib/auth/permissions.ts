import type { User } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

const ADMIN_ROLE_NAMES = new Set(["admin", "super_admin", "superadmin", "owner"])

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
 * Check if user has admin access via metadata or env variables
 * This is synchronous and used in middleware
 */
export function userHasAdminAccess(user: User | null | undefined): boolean {
  if (!user) {
    return false
  }

  const collectedRoles = new Set<string>()

  if (typeof user.role === "string") {
    collectedRoles.add(user.role.toLowerCase())
  }

  const appMetadata = (user.app_metadata ?? {}) as Record<string, unknown>
  const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>

  const addRole = (value: unknown) => {
    if (typeof value === "string") {
      collectedRoles.add(value.toLowerCase())
    }
    if (Array.isArray(value)) {
      value.filter((role): role is string => typeof role === "string").forEach((role) => {
        collectedRoles.add(role.toLowerCase())
      })
    }
  }

  addRole(appMetadata.role)
  addRole(userMetadata.role)
  addRole(appMetadata.roles)
  addRole(userMetadata.roles)
  addRole((appMetadata.claims as Record<string, unknown> | undefined)?.role)

  if ([...collectedRoles].some((role) => ADMIN_ROLE_NAMES.has(role))) {
    return true
  }

  const email = user.email?.toLowerCase()
  if (email && ADMIN_EMAILS.has(email)) {
    return true
  }

  return false
}

/**
 * Check if user has admin access in the database
 * This is async and should be used in server components
 */
export async function userHasAdminAccessDB(
  supabase: SupabaseClient,
  userId: string | undefined,
): Promise<boolean> {
  if (!userId) return false

  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" - not an error for us
      console.error("Error checking admin role:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("Error checking admin access:", error)
    return false
  }
}

/**
 * Combined check: metadata/env OR database
 * Use this in server components for full coverage
 */
export async function userIsAdmin(supabase: SupabaseClient, user: User | null | undefined): Promise<boolean> {
  if (!user) return false

  // First check metadata/env (fast, no DB query)
  if (userHasAdminAccess(user)) {
    return true
  }

  // Then check database
  return await userHasAdminAccessDB(supabase, user.id)
}
