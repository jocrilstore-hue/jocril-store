import { createClient } from "@/lib/supabase/server"
import { UsersManagement } from "@/components/admin/users/users-management"

export const metadata = {
  title: "Gestão de Utilizadores | Admin Jocril",
  description: "Gerir utilizadores e permissões de acesso",
}

export default async function UsersPage() {
  const supabase = await createClient()

  // Fetch all users from auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error("Error fetching users:", authError)
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Gestão de Utilizadores</h1>
        <p className="mt-4 text-destructive">Erro ao carregar utilizadores. Verifique as permissões do Supabase.</p>
      </div>
    )
  }

  const users = authData?.users || []

  // Fetch all user roles
  const { data: rolesData } = await supabase.from("user_roles").select("user_id, role, granted_at, granted_by")

  // Create a map of user_id => roles
  const rolesMap = new Map<string, { role: string; granted_at: string; granted_by: string | null }[]>()
  rolesData?.forEach((role) => {
    if (!rolesMap.has(role.user_id)) {
      rolesMap.set(role.user_id, [])
    }
    rolesMap.get(role.user_id)!.push({
      role: role.role,
      granted_at: role.granted_at,
      granted_by: role.granted_by,
    })
  })

  // Combine users with their roles
  const usersWithRoles = users.map((user) => ({
    id: user.id,
    email: user.email || "",
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    roles: rolesMap.get(user.id) || [],
    is_admin: rolesMap.get(user.id)?.some((r) => r.role === "admin") || false,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Utilizadores</h1>
        <p className="text-muted-foreground">Gerir utilizadores e conceder acesso ao painel de administração</p>
      </div>

      <UsersManagement users={usersWithRoles} />
    </div>
  )
}
