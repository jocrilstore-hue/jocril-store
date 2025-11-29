import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpDown, Eye } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductTemplateForm } from "@/components/admin/products/product-template-form";
import {
  fetchApplications,
  fetchProductTaxonomies,
  fetchProductTemplateDetail,
  fetchTemplateImages,
} from "@/lib/supabase/queries/admin-products";
import { Button } from "@/components/ui/button";

interface ProductTemplatePageProps {
  params: { id: string } | Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProductTemplatePage({
  params,
}: ProductTemplatePageProps) {
  const resolvedParams = await Promise.resolve(params);
  const templateId = Number(resolvedParams?.id);

  if (!resolvedParams || Number.isNaN(templateId)) {
    notFound();
  }

  const [template, taxonomies, applications, templateImages] =
    await Promise.all([
      fetchProductTemplateDetail(templateId),
      fetchProductTaxonomies(),
      fetchApplications(),
      fetchTemplateImages(templateId),
    ]);

  if (!template) {
    notFound();
  }

  const lastUpdate = template.updatedAt
    ? new Date(template.updatedAt).toLocaleString("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className="w-full space-y-6">
      <AdminPageHeader
        title={`Editar produto · ${template.name}`}
        description="Revise o conteúdo, metadados e taxonomias antes de publicar no site."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/admin/products">
                <ArrowLeft className="h-4 w-4" />
                Voltar à lista
              </Link>
            </Button>
            <Button asChild variant="secondary" className="gap-2">
              <Link href={`/admin/products/${templateId}/variants`}>
                <ArrowUpDown className="h-4 w-4" />
                Gerir variações
              </Link>
            </Button>
            {template.slug ? (
              <Button asChild variant="ghost" className="gap-2">
                <Link
                  href={`/produtos/${template.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Eye className="h-4 w-4" />
                  Ver no site
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" className="gap-2" disabled>
                <Eye className="h-4 w-4" />
                Ver no site
              </Button>
            )}
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border bg-background p-4">
            <p className="text-xs text-muted-foreground">Estado</p>
            <p
              className={`text-sm font-semibold ${template.isActive ? "text-emerald-600" : "text-slate-600"}`}
            >
              {template.isActive ? "Ativo" : "Inativo"}
            </p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <p className="text-xs text-muted-foreground">Variações totais</p>
            <p className="text-2xl font-semibold">
              {template.variantCount ?? 0}
            </p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <p className="text-xs text-muted-foreground">Variações ativas</p>
            <p className="text-2xl font-semibold">
              {template.activeVariantCount ?? 0}
            </p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <p className="text-xs text-muted-foreground">Última atualização</p>
            <p className="text-sm font-semibold">{lastUpdate}</p>
          </div>
        </div>
      </AdminPageHeader>
      <ProductTemplateForm
        mode="edit"
        template={template}
        taxonomies={taxonomies}
        applications={applications}
        initialImages={templateImages}
      />
    </div>
  );
}
