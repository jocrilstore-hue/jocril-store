"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import type {
  ProductTemplateDetail,
  SizeFormatOption,
  VariantSummary,
} from "@/lib/supabase/queries/admin-products"
import { ArrowUpDown, Edit, Link2, MoreHorizontal, Plus, RefreshCcw, Sparkles, Trash2 } from "lucide-react"
import { StockBadge, StockIndicator } from "@/components/ui/stock-badge"

interface ProductVariantsBoardProps {
  template: ProductTemplateDetail
  variants: VariantSummary[]
  sizeFormats: SizeFormatOption[]
}

export function ProductVariantsBoard({ template, variants, sizeFormats }: ProductVariantsBoardProps) {
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [sizeFilter, setSizeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [variantState, setVariantState] = useState(variants)

  useEffect(() => {
    setVariantState(variants)
  }, [variants])

  const filteredVariants = variantState.filter((variant) => {
    const matchesSearch =
      !search ||
      variant.sku.toLowerCase().includes(search.toLowerCase()) ||
      variant.sizeFormat?.name.toLowerCase().includes(search.toLowerCase()) ||
      variant.urlSlug.toLowerCase().includes(search.toLowerCase())
    const matchesSize = sizeFilter === "all" || String(variant.sizeFormatId) === sizeFilter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && variant.isActive) ||
      (statusFilter === "inactive" && !variant.isActive)

    return matchesSearch && matchesSize && matchesStatus
  })

  const activeCount = variantState.filter((variant) => variant.isActive).length
  const lowStockCount = variantState.filter((variant) => (variant.stockQuantity ?? 0) < 10).length

  const handleToggle = async (variant: VariantSummary) => {
    const { error } = await supabase
      .from("product_variants")
      .update({ is_active: !variant.isActive })
      .eq("id", variant.id)
    if (error) {
      toast({
        title: "Não foi possível atualizar",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Estado atualizado",
      description: `${variant.sku} está agora ${variant.isActive ? "inativo" : "ativo"}.`,
    })
    setVariantState((current) =>
      current.map((item) => (item.id === variant.id ? { ...item, isActive: !variant.isActive } : item)),
    )
  }

  const handleDelete = async (variant: VariantSummary) => {
    if (!confirm("Eliminar esta variação?")) return
    const { error } = await supabase.from("product_variants").delete().eq("id", variant.id)
    if (error) {
      toast({
        title: "Erro ao eliminar",
        description: "Remova imagens e preços associados antes de eliminar.",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Variação removida",
      description: `${variant.sku} foi eliminada.`,
    })
    setVariantState((current) => current.filter((item) => item.id !== variant.id))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Localize rapidamente as variantes por SKU, tamanho ou estado.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Pesquisar por SKU ou tamanho..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div>
            <Select value={sizeFilter} onValueChange={setSizeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os formatos</SelectItem>
                {sizeFormats.map((format) => (
                  <SelectItem key={format.id} value={String(format.id)}>
                    {format.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total de variantes</p>
              <p className="text-2xl font-semibold">{variantState.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ativas</p>
              <p className="text-2xl font-semibold">{activeCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stoques críticos</p>
              <p className="text-2xl font-semibold">{lowStockCount}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="gap-2">
              <Link href={`/admin/products/${template.id}/variants/new`}>
                <Plus className="h-4 w-4" />
                Adicionar variante
              </Link>
            </Button>
            <Button variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Gerar variantes
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredVariants.map((variant) => (
          <Card key={variant.id} className={variant.isActive ? "" : "opacity-80"}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">
                  {variant.sizeFormat?.name ?? "Formato personalizado"}
                  {variant.sizeFormat?.code ? ` (${variant.sizeFormat.code.toUpperCase()})` : ""}
                </CardTitle>
                <CardDescription>
                  {variant.sizeFormat?.width_mm && variant.sizeFormat?.height_mm
                    ? `${variant.sizeFormat.width_mm} × ${variant.sizeFormat.height_mm} mm · `
                    : ""}
                  {variant.orientation === "horizontal" ? "Horizontal" : "Vertical/Bi"}
                </CardDescription>
              </div>
              <Badge variant={variant.isActive ? "secondary" : "outline"}>{variant.isActive ? "Ativo" : "Inativo"}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">SKU</p>
                  <p className="font-medium">{variant.sku}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Preço s/ IVA</p>
                  <p className="font-medium">{variant.basePriceExcludingVat.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stock</p>
                  <div className="mt-1">
                    <StockIndicator quantity={variant.stockQuantity ?? 0} lowStockThreshold={10} />
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Imagem</p>
                  <p className="font-medium">{variant.imageCount > 0 ? `${variant.imageCount} imagens` : "Por carregar"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {variant.priceTierCount > 0 && (
                  <Badge variant="outline">{variant.priceTierCount} níveis de preço</Badge>
                )}
                {!variant.mainImageUrl && <Badge variant="secondary">Sem imagem principal</Badge>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm" className="gap-2">
                  <Link href={`/admin/products/${template.id}/variants/${variant.id}/edit`}>
                    <Edit className="h-4 w-4" />
                    Editar
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href={`/produtos/${variant.urlSlug}`} target="_blank" rel="noreferrer">
                    <Link2 className="h-4 w-4" />
                    Ver no site
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações rápidas</DropdownMenuLabel>
                    <DropdownMenuItem className="gap-2" onClick={() => handleToggle(variant)}>
                      <ArrowUpDown className="h-4 w-4" />
                      {variant.isActive ? "Desativar" : "Ativar"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => toast({ title: "Duplicação", description: "Função em desenvolvimento." })}>
                      <RefreshCcw className="h-4 w-4" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => handleDelete(variant)}>
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredVariants.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma variação encontrada com os filtros aplicados.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
