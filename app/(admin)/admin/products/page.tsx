import type { ProductTemplateFilters } from "@/lib/supabase/queries/admin-products";
import {
  fetchAdminProductTemplates,
  fetchProductTaxonomies,
} from "@/lib/supabase/queries/admin-products";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductTemplatesTable } from "@/components/admin/products/product-templates-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

type SearchParams = Record<string, string | string[] | undefined>;

function parseFilters(searchParams?: SearchParams): ProductTemplateFilters {
  if (!searchParams) {
    return { status: "all", sort: "order-asc" };
  }

  const raw = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const toNumber = (value?: string | null) => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  return {
    search: raw("search") ?? undefined,
    categoryId: toNumber(raw("categoryId")),
    materialId: toNumber(raw("materialId")),
    status: (raw("status") as ProductTemplateFilters["status"]) ?? "all",
    sort: (raw("sort") as ProductTemplateFilters["sort"]) ?? "order-asc",
    page: toNumber(raw("page")),
    pageSize: toNumber(raw("pageSize")),
  };
}

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const resolvedSearchParams = searchParams
    ? await Promise.resolve(searchParams)
    : undefined;
  const filters = parseFilters(resolvedSearchParams);
  const [templates, taxonomies] = await Promise.all([
    fetchAdminProductTemplates(filters),
    fetchProductTaxonomies(),
  ]);

  const activeOnPage = templates.items.filter((item) => item.isActive).length;
  const featuredOnPage = templates.items.filter(
    (item) => item.isFeatured,
  ).length;

  return (
    <div className="w-full space-y-6">
      <AdminPageHeader
        title="Produtos"
        description="Gerencie o catálogo de produtos e respetivas variações."
        actions={
          <Button asChild>
            <Link href="/admin/products/new" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo produto
            </Link>
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border bg-background p-4">
            <p className="text-xs text-muted-foreground">
              Total no filtro atual
            </p>
            <p className="text-2xl font-semibold">{templates.total}</p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <p className="text-xs text-muted-foreground">Ativos na página</p>
            <p className="text-2xl font-semibold">{activeOnPage}</p>
          </div>
          <div className="rounded-lg border bg-background p-4 xl:col-span-2">
            <p className="text-xs text-muted-foreground">
              Em destaque na página
            </p>
            <p className="text-2xl font-semibold">{featuredOnPage}</p>
          </div>
        </div>
      </AdminPageHeader>

      <ProductTemplatesTable
        initialData={templates}
        taxonomies={taxonomies}
        initialFilters={filters}
      />
    </div>
  );
}
