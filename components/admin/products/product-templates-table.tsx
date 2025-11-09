"use client"

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowUpDown,
  Check,
  Copy,
  Eye,
  Filter,
  ImageIcon,
  MoreHorizontal,
  Pencil,
  Search,
  Star,
  Trash2,
} from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { createClient } from "@/lib/supabase/client"
import type {
  PaginatedProductTemplates,
  ProductTaxonomyData,
  ProductTemplateFilters,
  ProductTemplateSummary,
} from "@/lib/supabase/queries/admin-products"

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Inativos" },
  { value: "featured", label: "Em destaque" },
]

const SORT_OPTIONS = [
  { value: "order-asc", label: "Ordenação manual" },
  { value: "name-asc", label: "Nome (A-Z)" },
  { value: "name-desc", label: "Nome (Z-A)" },
  { value: "updated-desc", label: "Atualizados recentemente" },
  { value: "updated-asc", label: "Atualizados há mais tempo" },
]

const statusBadgeMap: Record<"active" | "inactive", string> = {
  active: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  inactive: "bg-slate-100 text-slate-600 border border-slate-200",
}

interface ProductTemplatesTableProps {
  initialData: PaginatedProductTemplates
  taxonomies: ProductTaxonomyData
  initialFilters: ProductTemplateFilters
}

export function ProductTemplatesTable({
  initialData,
  taxonomies,
  initialFilters,
}: ProductTemplatesTableProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()
  const [data, setData] = useState<PaginatedProductTemplates>(initialData)
  const [selection, setSelection] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: initialFilters.search ?? "",
    categoryId: initialFilters.categoryId ? String(initialFilters.categoryId) : "",
    materialId: initialFilters.materialId ? String(initialFilters.materialId) : "",
    status: initialFilters.status ?? "all",
    sort: initialFilters.sort ?? "order-asc",
    page: initialData.page,
    pageSize: initialData.pageSize,
  })

  const debouncedSearch = useDebounce(filters.search, 400)

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        search: debouncedSearch,
        categoryId: filters.categoryId,
        materialId: filters.materialId,
        status: filters.status,
        sort: filters.sort,
        page: filters.page,
        pageSize: filters.pageSize,
      }),
    [debouncedSearch, filters.categoryId, filters.materialId, filters.page, filters.pageSize, filters.sort, filters.status],
  )

  const fetchTemplates = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setFetchError(null)

      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (filters.categoryId) params.set("categoryId", filters.categoryId)
      if (filters.materialId) params.set("materialId", filters.materialId)
      if (filters.status) params.set("status", filters.status)
      if (filters.sort) params.set("sort", filters.sort)
      params.set("page", String(filters.page))
      params.set("pageSize", String(filters.pageSize))

      try {
        const response = await fetch(`/api/admin/products?${params.toString()}`, {
          signal,
        })
        if (!response.ok) {
          throw new Error("Não foi possível carregar os produtos.")
        }
        const payload = (await response.json()) as PaginatedProductTemplates
        setData(payload)
        setSelection([])
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        console.error(error)
        setFetchError("Ocorreu um erro ao carregar os produtos.")
      } finally {
        setLoading(false)
      }
    },
    [debouncedSearch, filters.categoryId, filters.materialId, filters.page, filters.pageSize, filters.sort, filters.status],
  )

  useEffect(() => {
    const controller = new AbortController()
    fetchTemplates(controller.signal)
    return () => controller.abort()
  }, [queryKey, fetchTemplates])

  const handleBulkUpdate = async (patch: Record<string, unknown>, successMessage: string) => {
    if (selection.length === 0) return
    setLoading(true)
    const { error } = await supabase.from("product_templates").update(patch).in("id", selection)
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os produtos selecionados.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }
    toast({
      title: "Alterações aplicadas",
      description: successMessage,
    })
    await fetchTemplates()
  }

  const handleToggleActive = async (template: ProductTemplateSummary) => {
    setLoading(true)
    const { error } = await supabase
      .from("product_templates")
      .update({ is_active: !template.isActive })
      .eq("id", template.id)
    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Tente novamente dentro de alguns instantes.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }
    toast({
      title: "Estado atualizado",
      description: `${template.name} está agora ${template.isActive ? "inativo" : "ativo"}.`,
    })
    await fetchTemplates()
  }

  const handleDuplicate = async (template: ProductTemplateSummary) => {
    setLoading(true)
    const { error } = await supabase.rpc("duplicate_product_template", { source_template_id: template.id })
    if (error) {
      toast({
        title: "Não foi possível duplicar",
        description:
          error.message || "Verifique as permissões no Supabase RPC 'duplicate_product_template'.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }
    toast({
      title: "Produto duplicado",
      description: `${template.name} foi duplicado com sucesso.`,
    })
    await fetchTemplates()
  }

  const handleDelete = async (template: ProductTemplateSummary) => {
    if (
      !confirm(
        `Apagar "${template.name}"? Todas as variações associadas deixarão de estar acessíveis até criar um novo template.`,
      )
    ) {
      return
    }
    setLoading(true)
    const { error } = await supabase.from("product_templates").delete().eq("id", template.id)
    if (error) {
      toast({
        title: "Erro ao apagar",
        description:
          error.message || "Este produto pode ter variantes associadas. Remova-as antes de tentar novamente.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }
    toast({
      title: "Produto removido",
      description: `${template.name} foi eliminado.`,
    })
    await fetchTemplates()
  }

  const handleRowNavigation = (event: MouseEvent<HTMLTableRowElement>, templateId: number) => {
    const target = event.target as HTMLElement | null
    if (target?.closest("button, a, input, textarea, select, [role='checkbox']")) {
      return
    }
    router.push(`/admin/products/${templateId}`)
  }

  const isAllSelected = selection.length > 0 && selection.length === data.items.length

  const toggleSelection = (id: number) => {
    setSelection((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelection(data.items.map((item) => item.id))
    } else {
      setSelection([])
    }
  }

  const resetFilters = () => {
    setFilters({
      search: "",
      categoryId: "",
      materialId: "",
      status: "all",
      sort: "order-asc",
      page: 1,
      pageSize: filters.pageSize,
    })
  }

  const renderStatusBadge = (template: ProductTemplateSummary) => {
    const key = template.isActive ? "active" : "inactive"
    return <Badge className={cn("capitalize", statusBadgeMap[key])}>{template.isActive ? "Ativo" : "Inativo"}</Badge>
  }

  return (
    <div className="w-full space-y-6">
      <Card className="w-full border bg-background/90 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Pesquisa</label>
              <div className="mt-1 flex items-center gap-2 rounded-lg border bg-background px-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={filters.search}
                  onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value, page: 1 }))}
                  placeholder="Nome ou referência..."
                  className="border-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Categoria</label>
              <Select
                value={filters.categoryId || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, categoryId: value === "all" ? "" : value, page: 1 }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {taxonomies.categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Material</label>
              <Select
                value={filters.materialId || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, materialId: value === "all" ? "" : value, page: 1 }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos os materiais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {taxonomies.materials.map((material) => (
                    <SelectItem key={material.id} value={String(material.id)}>
                      {material.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Estado</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Ordenação</label>
              <Select value={filters.sort} onValueChange={(value) => setFilters((prev) => ({ ...prev, sort: value, page: 1 }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={resetFilters} className="gap-2">
              <Filter className="h-4 w-4" />
              Limpar filtros
            </Button>
            <span className="text-xs text-muted-foreground">
              A mostrar {data.items.length} de {data.total} resultados
            </span>
          </div>
        </CardContent>
      </Card>

      {selection.length > 0 && (
        <Card className="w-full border border-dashed bg-muted/50">
          <CardContent className="flex flex-wrap items-center gap-3 pt-6">
            <span className="text-sm font-semibold">{selection.length} selecionados</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleBulkUpdate({ is_active: true }, "Produtos ativados com sucesso.")}
                disabled={loading}
              >
                Ativar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkUpdate({ is_active: false }, "Produtos desativados com sucesso.")}
                disabled={loading}
              >
                Desativar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkUpdate({ is_featured: true }, "Produtos destacados.")}
                disabled={loading}
              >
                Destacar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkUpdate({ is_featured: false }, "Produtos removidos dos destaques.")}
                disabled={loading}
              >
                Remover destaque
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-destructive"
              onClick={() => setSelection([])}
            >
              Limpar seleção
            </Button>
          </CardContent>
        </Card>
      )}

      {fetchError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      <Card className="w-full overflow-hidden border bg-background shadow-sm">
        <CardContent className="overflow-x-auto p-0">
          <div className="min-w-[960px]">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={isAllSelected} onCheckedChange={(value) => handleSelectAll(Boolean(value))} aria-label="Selecionar todos" />
                </TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="text-center">Variações</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="w-16 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading &&
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-4 rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-md" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-5 w-12 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-6 w-6 rounded" />
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && data.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Nenhum produto encontrado</p>
                      <p className="text-sm text-muted-foreground">
                        Ajuste os filtros ou crie um novo template para começar.
                      </p>
                      <Button asChild size="sm">
                        <Link href="/admin/products/new">Criar template</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                data.items.map((template) => (
                  <TableRow
                    key={template.id}
                    data-state={selection.includes(template.id) ? "selected" : undefined}
                    className="cursor-pointer"
                    onClick={(event) => handleRowNavigation(event, template.id)}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selection.includes(template.id)}
                        onCheckedChange={() => toggleSelection(template.id)}
                        aria-label={`Selecionar ${template.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted">
                          {template.thumbnailUrl ? (
                            <img
                              src={template.thumbnailUrl}
                              alt={`Imagem de ${template.name}`}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/products/${template.id}`} className="font-semibold hover:underline">
                              {template.name}
                            </Link>
                            {template.isFeatured && <Star className="h-4 w-4 fill-primary text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground">/{template.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {template.category ? (
                        <Badge variant="outline">{template.category.name}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem categoria</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {template.material ? (
                        <Badge variant="outline">{template.material.name}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/D</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
                        <Link href={`/admin/products/${template.id}/variants`}>
                          {template.variantCount}{" "}
                          <ArrowUpDown className="h-3 w-3" />
                        </Link>
                      </Button>
                    </TableCell>
                    <TableCell>{renderStatusBadge(template)}</TableCell>
                    <TableCell>
                      {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem asChild disabled={loading}>
                            <Link href={`/admin/products/${template.id}`} className="cursor-pointer gap-2">
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild disabled={loading}>
                            <Link href={`/admin/products/${template.id}/variants`} className="cursor-pointer gap-2">
                              <ArrowUpDown className="h-4 w-4" />
                              Gerir variantes
                            </Link>
                          </DropdownMenuItem>
                          {template.slug ? (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/produtos/${template.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="cursor-pointer gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Ver no site
                              </Link>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem disabled className="gap-2 text-muted-foreground">
                              <Eye className="h-4 w-4" />
                              Ver no site (sem slug)
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="gap-2" onClick={() => handleDuplicate(template)} disabled={loading}>
                            <Copy className="h-4 w-4" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleToggleActive(template)} disabled={loading}>
                            <Check className="h-4 w-4" />
                            {template.isActive ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 text-destructive focus:text-destructive"
                            onClick={() => handleDelete(template)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                            Apagar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t bg-muted/30 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            Página {data.page} de {data.totalPages} • {data.total} produtos no total
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                  }}
                  aria-disabled={data.page === 1}
                  className={cn(data.page === 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              {Array.from({ length: data.totalPages }).map((_, index) => {
                const pageNumber = index + 1
                if (data.totalPages > 6) {
                  if (pageNumber === 1 || pageNumber === data.totalPages || Math.abs(pageNumber - data.page) <= 1) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href="#"
                          isActive={pageNumber === data.page}
                          onClick={(event) => {
                            event.preventDefault()
                            setFilters((prev) => ({ ...prev, page: pageNumber }))
                          }}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  }
                  if (pageNumber === 2 && data.page > 3) {
                    return (
                      <PaginationItem key={`ellipsis-start`}>
                        <span className="px-2 text-muted-foreground">...</span>
                      </PaginationItem>
                    )
                  }
                  if (pageNumber === data.totalPages - 1 && data.page < data.totalPages - 2) {
                    return (
                      <PaginationItem key={`ellipsis-end`}>
                        <span className="px-2 text-muted-foreground">...</span>
                      </PaginationItem>
                    )
                  }
                  return null
                }
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === data.page}
                      onClick={(event) => {
                        event.preventDefault()
                        setFilters((prev) => ({ ...prev, page: pageNumber }))
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    setFilters((prev) => ({ ...prev, page: Math.min(data.totalPages, prev.page + 1) }))
                  }}
                  aria-disabled={data.page === data.totalPages}
                  className={cn(data.page === data.totalPages && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      </Card>
    </div>
  )
}
