import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { userIsAdmin } from "@/lib/auth/permissions"
import { AdminShell } from "@/components/admin/admin-shell"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirectTo=/admin")
  }

  // Check both env variables AND database for admin access
  const isAdmin = await userIsAdmin(supabase, user)
  if (!isAdmin) {
    redirect("/")
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
  const profile = {
    id: user.id,
    email: user.email ?? null,
    name:
      (metadata.full_name as string | undefined) ??
      (metadata.name as string | undefined) ??
      user.email,
    avatarUrl: (metadata.avatar_url as string | undefined) ?? undefined,
  }

  return <AdminShell user={profile}>{children}</AdminShell>
}
