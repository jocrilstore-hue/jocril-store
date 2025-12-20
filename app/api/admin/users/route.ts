import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { userIsAdmin } from "@/lib/auth/permissions"

export interface ClerkUser {
  id: string
  email: string
  fullName: string | null
  imageUrl: string
  isAdmin: boolean
  createdAt: number
  lastSignInAt: number | null
}

export async function GET() {
  const { userId } = await auth()

  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  try {
    const client = await clerkClient()
    const usersResponse = await client.users.getUserList({ limit: 100 })

    const users: ClerkUser[] = usersResponse.data.map((user) => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      fullName: user.fullName,
      imageUrl: user.imageUrl,
      isAdmin: user.publicMetadata?.role === "admin",
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
    }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json(
      { error: "Erro ao carregar utilizadores" },
      { status: 500 }
    )
  }
}
