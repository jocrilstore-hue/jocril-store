import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { userIsAdmin } from "@/lib/auth/permissions"

interface RouteParams {
  params: Promise<{ userId: string }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { userId: currentUserId } = await auth()

  if (!currentUserId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  try {
    const { userId: targetUserId } = await params
    const { isAdmin } = await request.json()

    // Prevent self-demotion
    if (targetUserId === currentUserId && !isAdmin) {
      return NextResponse.json(
        { error: "Não pode remover o seu próprio acesso de administrador" },
        { status: 400 }
      )
    }

    const client = await clerkClient()

    // Get current user's metadata to preserve other fields
    const targetUser = await client.users.getUser(targetUserId)
    const currentMetadata = targetUser.publicMetadata || {}

    // Update user's public metadata with new role
    await client.users.updateUser(targetUserId, {
      publicMetadata: {
        ...currentMetadata,
        role: isAdmin ? "admin" : "user",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update user role:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar permissões" },
      { status: 500 }
    )
  }
}
