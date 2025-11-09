import { NextResponse, type NextRequest } from "next/server"
import { fetchAdminProductTemplates, type ProductTemplateSort, type ProductTemplateStatusFilter } from "@/lib/supabase/queries/admin-products"
import { createClient } from "@/lib/supabase/server"
import { userHasAdminAccess } from "@/lib/auth/permissions"

function parseNumberParam(value: string | null) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !userHasAdminAccess(user)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { searchParams } = request.nextUrl

  const filters = {
    search: searchParams.get("search") ?? undefined,
    categoryId: parseNumberParam(searchParams.get("categoryId")),
    materialId: parseNumberParam(searchParams.get("materialId")),
    status: (searchParams.get("status") as ProductTemplateStatusFilter) ?? "all",
    sort: (searchParams.get("sort") as ProductTemplateSort) ?? "order-asc",
    page: parseNumberParam(searchParams.get("page")),
    pageSize: parseNumberParam(searchParams.get("pageSize")),
  }

  try {
    const data = await fetchAdminProductTemplates(filters, supabase)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Failed to fetch admin products", error)
    return NextResponse.json({ error: "Erro ao carregar produtos" }, { status: 500 })
  }
}
