"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Search } from "lucide-react"
import Image from "next/image"

interface Product {
  id: string
  sku: string
  base_price_including_vat: number
  main_image_url: string | null
  url_slug: string
  is_bestseller: boolean
  stock_status: string
  product_templates: {
    name: string
    short_description: string
    category_id: string
  }
  size_formats: {
    name: string
  }
}

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductsClientProps {
  initialProducts: Product[]
  categories: Category[]
  minPrice: number
  maxPrice: number
  initialParams: {
    search?: string
    minPrice?: string
    maxPrice?: string
    categories?: string
    sort?: string
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const isValidPrice = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0

export function ProductsClient({
  initialProducts,
  categories,
  minPrice: serverMinPrice,
  maxPrice: serverMaxPrice,
  initialParams
}: ProductsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchQuery, setSearchQuery] = useState(initialParams.search ?? "")
  const priceValues = useMemo(
    () =>
      initialProducts
        .map((product) => product.base_price_including_vat)
        .filter((price) => typeof price === "number" && !Number.isNaN(price) && price >= 0),
    [initialProducts]
  )

  const derivedMinPrice = priceValues.length ? Math.min(...priceValues) : undefined
  const derivedMaxPrice = priceValues.length ? Math.max(...priceValues) : undefined

  const sliderMin = isValidPrice(serverMinPrice)
    ? serverMinPrice
    : derivedMinPrice ?? 0

  const sliderMaxCandidate = isValidPrice(serverMaxPrice)
    ? serverMaxPrice
    : derivedMaxPrice ?? sliderMin

  const sliderMax = sliderMaxCandidate >= sliderMin ? sliderMaxCandidate : sliderMin
  const hasPriceData = priceValues.length > 0 || isValidPrice(serverMaxPrice)

  const normalizedInitialRange = useMemo<[number, number]>(() => {
    const parsedMin = initialParams.minPrice ? parseFloat(initialParams.minPrice) : sliderMin
    const parsedMax = initialParams.maxPrice ? parseFloat(initialParams.maxPrice) : sliderMax

    const safeMin = Number.isFinite(parsedMin) ? parsedMin : sliderMin
    const safeMax = Number.isFinite(parsedMax) ? parsedMax : sliderMax

    const clampedMin = clamp(safeMin, sliderMin, sliderMax)
    const clampedMax = clamp(safeMax, clampedMin, sliderMax)

    return [clampedMin, clampedMax]
  }, [initialParams.minPrice, initialParams.maxPrice, sliderMin, sliderMax])

  const [priceRange, setPriceRange] = useState<[number, number]>(normalizedInitialRange)

  useEffect(() => {
    // Keep slider handles aligned with incoming filter changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPriceRange((previous) => {
      if (previous[0] === normalizedInitialRange[0] && previous[1] === normalizedInitialRange[1]) {
        return previous
      }
      return normalizedInitialRange
    })
  }, [normalizedInitialRange])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialParams.categories?.split(",").filter(Boolean) ?? []
  )
  const [sortBy, setSortBy] = useState(initialParams.sort ?? "relevance")

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    startTransition(() => {
      router.push(`/produtos?${params.toString()}`, { scroll: false })
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    updateFilters({ search: value || undefined })
  }

  const handlePriceChange = (values: number[]) => {
    const [min, max] = values
    const nextMin = Number(min.toFixed(2))
    const nextMax = Number(max.toFixed(2))
    const hasAdjustableRange = sliderMax > sliderMin

    setPriceRange([nextMin, nextMax])

    // Only persist when user actually narrows the range
    updateFilters({
      minPrice: hasAdjustableRange && nextMin > sliderMin ? nextMin.toFixed(2) : undefined,
      maxPrice: hasAdjustableRange && nextMax < sliderMax ? nextMax.toFixed(2) : undefined
    })
  }

  const toggleCategory = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId]

    setSelectedCategories(newCategories)
    updateFilters({
      categories: newCategories.length > 0 ? newCategories.join(",") : undefined
    })
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    updateFilters({ sort: value !== "relevance" ? value : undefined })
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setPriceRange([sliderMin, sliderMax])
    setSelectedCategories([])
    setSortBy("relevance")
    router.push("/produtos")
  }

  const getCategoryProductCount = (categoryId: string) => {
    return initialProducts.filter((p) => p.product_templates.category_id === categoryId).length
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            {initialProducts.length} produtos encontrados
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="sticky top-4 bg-card border border-border">
              {/* FILTROS Header */}
              <div className="px-6 pt-6 pb-4 border-b-2 border-foreground">
                <h2 className="text-sm font-bold uppercase">
                  FILTROS
                </h2>
              </div>

              {/* Search */}
              <div className="px-6 pt-7 pb-7 border-b border-border">
                <Label
                  htmlFor="search"
                  className="block mb-3 text-xs font-semibold uppercase text-foreground"
                >
                  Pesquisar
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="pointer-events-none"
                    >
                      <circle
                        cx="11"
                        cy="11"
                        r="6.5"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      />
                      <line
                        x1="15.2"
                        y1="15.2"
                        x2="19"
                        y2="19"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <Input
                    id="search"
                    placeholder="Nome ou descrição..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="h-11 pl-10 pr-3 text-xs border border-border bg-muted rounded-none transition-colors duration-150 ease-out focus-visible:bg-background focus-visible:border-foreground focus-visible:ring-0 focus-visible:outline-none"
                  />
                </div>
              </div>

              {/* Price Range */}
              <div className="px-6 pt-7 pb-7 border-b border-border">
                <Label className="block mb-4 text-xs font-semibold uppercase text-foreground">
                  Preço
                </Label>
                <div className="mt-2 mb-3">
                  <Slider
                    value={priceRange}
                    min={sliderMin}
                    max={sliderMax}
                    step={0.01}
                    onValueChange={handlePriceChange}
                    disabled={sliderMax === sliderMin}
                    className="
                      [&_[data-orientation=horizontal]]:h-1
                      [&_[data-orientation=horizontal]]:bg-border
                      [&_[data-orientation=horizontal]_[data-state=on]]:bg-primary
                      [&_[role=slider]]:h-3.5
                      [&_[role=slider]]:w-3.5
                      [&_[role=slider]]:bg-background
                      [&_[role=slider]]:border
                      [&_[role=slider]]:border-primary
                      [&_[role=slider]]:shadow-none
                    "
                  />
                </div>
                <div className="flex justify-between items-center text-xs font-medium text-foreground">
                  <span>{hasPriceData ? priceRange[0].toFixed(2) : "0.00"} €</span>
                  <span>{hasPriceData ? priceRange[1].toFixed(2) : "0.00"} €</span>
                </div>
              </div>

              {/* Categories */}
              <div className="px-6 pt-7 pb-6">
                <Label className="block mb-4 text-xs font-semibold uppercase text-foreground">
                  Categorias
                </Label>
                <div className="flex flex-col gap-0.5">
                  {categories.map((category) => {
                    const count = getCategoryProductCount(category.id)
                    const isSelected = selectedCategories.includes(category.id)
                    const isDisabled = count === 0
                    return (
                      <button
                        key={category.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => !isDisabled && toggleCategory(category.id)}
                        className={[
                          "flex items-center justify-between w-full px-2.5 py-2.5 text-left border border-transparent bg-transparent",
                          "transition-colors duration-150 ease-out",
                          "gap-3",
                          isDisabled
                            ? "opacity-40 cursor-not-allowed"
                            : "cursor-pointer hover:bg-muted hover:border-border",
                          isSelected
                            ? "bg-muted border-foreground"
                            : ""
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={[
                              "flex items-center justify-center w-4.5 h-4.5 border border-input bg-background",
                              "transition-colors duration-150",
                              isSelected ? "bg-foreground border-foreground" : "",
                              isDisabled ? "border-border" : ""
                            ].join(" ")}
                          >
                            {isSelected && (
                              <svg
                                width="11"
                                height="8"
                                viewBox="0 0 11 8"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="text-white"
                              >
                                <path
                                  d="M1 4.2L3.4 6.6L10 1"
                                  stroke="currentColor"
                                  strokeWidth="1.4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </span>
                          <span
                            className={[
                              "text-xs leading-none",
                              "transition-colors duration-150",
                              isSelected ? "font-semibold text-foreground" : "font-normal text-foreground"
                            ].join(" ")}
                          >
                            {category.name}
                          </span>
                        </div>
                        <span
                          className={[
                            "text-xs tabular-nums",
                            isSelected ? "text-foreground" : "text-muted-foreground"
                          ].join(" ")}
                        >
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="px-6 pb-6 pt-5 border-t border-border bg-background">
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-none border border-border text-xs uppercase bg-transparent hover:bg-foreground hover:text-background transition-colors duration-150"
                  onClick={handleClearFilters}
                >
                  Limpar filtros
                </Button>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            {/* Sort dropdown */}
            <div className="flex justify-end mb-6">
              <div className="flex items-center gap-2">
                <Label htmlFor="sort" className="text-sm">
                  Ordenar por:
                </Label>
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger id="sort" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevância</SelectItem>
                    <SelectItem value="name">Nome</SelectItem>
                    <SelectItem value="price-asc">Preço: Menor</SelectItem>
                    <SelectItem value="price-desc">Preço: Maior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Loading overlay */}
            {isPending && (
              <div className="fixed inset-0 bg-background/50 z-50 flex items-center justify-center">
                <p className="text-muted-foreground">A atualizar...</p>
              </div>
            )}

            {/* Products grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {initialProducts.map((product) => (
                <Link key={product.id} href={`/produtos/${product.url_slug}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col overflow-hidden pt-0">
                    <div className="relative aspect-square bg-muted rounded-t-lg overflow-hidden">
                      {product.main_image_url ? (
                        <Image
                          src={product.main_image_url}
                          alt={product.product_templates.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-muted-foreground">Sem imagem</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary" className="text-xs">
                          {product.size_formats.name}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="pt-4 flex-1 flex flex-col">
                      <p className="text-xs text-muted-foreground mb-1">{product.sku}</p>
                      <CardTitle className="text-base font-semibold mb-2 line-clamp-2">
                        {product.product_templates.name.toUpperCase()}
                      </CardTitle>
                      <div className="mt-auto">
                        <p className="text-xl font-bold" style={{ color: "oklch(0.75 0.12 192)" }}>
                          desde {product.base_price_including_vat.toFixed(2)} €
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(product.base_price_including_vat / 1.23).toFixed(2)} € (s/IVA)
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {initialProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum produto encontrado com os filtros selecionados.</p>
                <Button
                  variant="outline"
                  className="mt-4 bg-transparent"
                  onClick={handleClearFilters}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
