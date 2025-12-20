import { NextResponse, type NextRequest } from "next/server"
import { fetchAdminProductTemplates, type ProductTemplateSort, type ProductTemplateStatusFilter } from "@/lib/supabase/queries/admin-products"
import { createClient } from "@/lib/supabase/server"
import { auth } from "@clerk/nextjs/server"
import { userIsAdmin } from "@/lib/auth/permissions"
import { logger } from "@/lib/logger"

function parseNumberParam(value: string | null) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  
  if (!userId || !(await userIsAdmin())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const supabase = await createClient()

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
    logger.exception(error, { route: "/api/admin/products", method: "GET" })
    return NextResponse.json({ error: "Erro ao carregar produtos" }, { status: 500 })
  }
}

