import type React from "react"
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import { userIsAdmin } from "@/lib/auth/permissions"
import { AdminShell } from "@/components/admin/admin-shell"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()

  if (!user) {
    redirect("/sign-in?redirect_url=/admin")
  }

  // Check admin access via Clerk metadata or env variables
  const isAdmin = await userIsAdmin()
  if (!isAdmin) {
    redirect("/")
  }

  const profile = {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress ?? null,
    name: user.fullName ?? user.username ?? user.emailAddresses[0]?.emailAddress,
    avatarUrl: user.imageUrl ?? undefined,
  }

  return <AdminShell user={profile}>{children}</AdminShell>
}
