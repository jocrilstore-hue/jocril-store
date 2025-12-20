import { UsersManagement } from "@/components/admin/users/users-management"

export const metadata = {
  title: "Gestão de Utilizadores | Admin Jocril",
  description: "Gerir utilizadores e permissões de acesso",
}

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Gestão de Utilizadores
        </h1>
        <p className="text-muted-foreground">
          Gerir utilizadores e conceder acesso ao painel de administração
        </p>
      </div>

      <UsersManagement />
    </div>
  )
}
