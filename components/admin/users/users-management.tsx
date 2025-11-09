"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Shield, ShieldCheck, User } from "lucide-react"
import { handleAsyncOperation } from "@/lib/utils/supabase-errors"

interface UserWithRoles {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  roles: Array<{ role: string; granted_at: string; granted_by: string | null }>
  is_admin: boolean
}

interface UsersManagementProps {
  users: UserWithRoles[]
}

export function UsersManagement({ users: initialUsers }: UsersManagementProps) {
  const [users, setUsers] = useState(initialUsers)
  const { toast } = useToast()
  const supabase = createClient()

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return

    // Optimistically update UI
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_admin: !currentIsAdmin } : u)))

    const result = await handleAsyncOperation(
      async () => {
        if (currentIsAdmin) {
          // Remove admin role
          const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin")
          if (error) throw error
        } else {
          // Get current user ID for granted_by
          const {
            data: { user: currentUser },
          } = await supabase.auth.getUser()

          // Add admin role
          const { error } = await supabase.from("user_roles").insert({
            user_id: userId,
            role: "admin",
            granted_by: currentUser?.id || null,
          })
          if (error) throw error
        }
        return true
      },
      {
        successMessage: currentIsAdmin
          ? `Acesso de administrador removido para ${user.email}`
          : `${user.email} agora é administrador`,
        errorTitle: "Erro ao atualizar permissões",
        showToast: toast,
      },
    )

    // Revert optimistic update if failed
    if (!result.success) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_admin: currentIsAdmin } : u)))
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca"
    return new Date(dateString).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const adminCount = users.filter((u) => u.is_admin).length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Utilizadores</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Utilizadores registados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground">Com acesso ao painel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length - adminCount}</div>
            <p className="text-xs text-muted-foreground">Apenas clientes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utilizadores</CardTitle>
          <CardDescription>Gerir permissões de acesso ao painel de administração</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registado</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead className="text-right">Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.is_admin && <Shield className="h-4 w-4 text-primary" />}
                      <span className="font-medium">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.is_admin ? (
                      <Badge variant="default">Administrador</Badge>
                    ) : (
                      <Badge variant="secondary">Cliente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(user.last_sign_in_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-muted-foreground">{user.is_admin ? "Sim" : "Não"}</span>
                      <Switch checked={user.is_admin} onCheckedChange={() => handleToggleAdmin(user.id, user.is_admin)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhum utilizador registado ainda
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <Shield className="h-5 w-5" />
            Informação Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-900">
          <p>
            <strong>Como funciona:</strong> Ative o botão "Admin" para dar acesso ao painel de administração a qualquer
            utilizador.
          </p>
          <p>
            <strong>Para o seu chefe:</strong> Peça-lhe para criar uma conta normal em "Criar Conta". Depois, volte aqui e
            ative o acesso de administrador para o email dele.
          </p>
          <p>
            <strong>Nota:</strong> Utilizadores com admin no ficheiro .env também têm acesso automático.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
