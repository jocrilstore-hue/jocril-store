"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Shield, ShieldCheck, User, RefreshCw, AlertCircle } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import type { ClerkUser } from "@/app/api/admin/users/route"

export function UsersManagement() {
  const [users, setUsers] = useState<ClerkUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const { toast } = useToast()
  const { user: currentUser } = useUser()

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/users")
      if (!response.ok) {
        throw new Error("Erro ao carregar utilizadores")
      }
      const data = await response.json()
      setUsers(data.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    const user = users.find((u) => u.id === userId)
    if (!user) return

    // Check if trying to demote self
    if (userId === currentUser?.id && currentIsAdmin) {
      toast({
        title: "Ação não permitida",
        description: "Não pode remover o seu próprio acesso de administrador",
        variant: "destructive",
      })
      return
    }

    // Confirm action
    const action = currentIsAdmin ? "remover o acesso de administrador de" : "conceder acesso de administrador a"
    if (!confirm(`Tem a certeza que deseja ${action} ${user.email}?`)) {
      return
    }

    setUpdatingUserId(userId)

    // Optimistically update UI
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isAdmin: !currentIsAdmin } : u))
    )

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !currentIsAdmin }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao atualizar permissões")
      }

      toast({
        title: "Permissões atualizadas",
        description: currentIsAdmin
          ? `Acesso de administrador removido para ${user.email}`
          : `${user.email} agora é administrador`,
      })
    } catch (err) {
      // Revert optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAdmin: currentIsAdmin } : u))
      )
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao atualizar permissões",
        variant: "destructive",
      })
    } finally {
      setUpdatingUserId(null)
    }
  }

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "Nunca"
    return new Date(timestamp).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const adminCount = users.filter((u) => u.isAdmin).length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive font-medium mb-4">{error}</p>
          <Button onClick={fetchUsers} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

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
            <p className="text-xs text-muted-foreground">Utilizadores registados no Clerk</p>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Utilizadores</CardTitle>
            <CardDescription>Gerir permissões de acesso ao painel de administração</CardDescription>
          </div>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilizador</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registado</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead className="text-right">Administrador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {user.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt={user.fullName || user.email}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          {user.isAdmin && <Shield className="h-4 w-4 text-primary" />}
                          <span className="font-medium">{user.fullName || user.email}</span>
                        </div>
                        {user.fullName && (
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.isAdmin ? (
                      <Badge variant="default">Administrador</Badge>
                    ) : (
                      <Badge variant="secondary">Cliente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.lastSignInAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-muted-foreground">
                        {user.isAdmin ? "Sim" : "Não"}
                      </span>
                      <Switch
                        checked={user.isAdmin}
                        onCheckedChange={() => handleToggleAdmin(user.id, user.isAdmin)}
                        disabled={updatingUserId === user.id}
                      />
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

      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <Shield className="h-5 w-5" />
            Informação Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-900 dark:text-amber-200">
          <p>
            <strong>Como funciona:</strong> Ative o botão "Administrador" para dar acesso ao painel de administração a qualquer utilizador.
          </p>
          <p>
            <strong>Para o seu chefe:</strong> Peça-lhe para criar uma conta em "Criar Conta". Depois, volte aqui e ative o acesso de administrador para o email dele.
          </p>
          <p>
            <strong>Nota:</strong> Utilizadores com email no <code className="bg-amber-200/50 dark:bg-amber-800/50 px-1 rounded">ADMIN_EMAILS</code> também têm acesso automático.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
