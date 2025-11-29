"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import Image from "next/image";

interface Product {
  id: string;
  sku: string;
  base_price_including_vat: number;
  main_image_url: string | null;
  url_slug: string;
  is_bestseller: boolean;
  stock_status: string;
  product_templates: {
    name: string;
    short_description: string;
    category_id: string;
  };
  size_formats: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductsClientProps {
  initialProducts: Product[];
  categories: Category[];
  minPrice: number;
  maxPrice: number;
  initialParams: {
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    categories?: string;
    sort?: string;
  };
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const isValidPrice = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export function ProductsClient({
  initialProducts,
  categories,
  minPrice: serverMinPrice,
  maxPrice: serverMaxPrice,
  initialParams,
}: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(initialParams.search ?? "");
  const priceValues = useMemo(
    () =>
      initialProducts
        .map((product) => product.base_price_including_vat)
        .filter(
          (price) =>
            typeof price === "number" && !Number.isNaN(price) && price >= 0,
        ),
    [initialProducts],
  );

  const derivedMinPrice = priceValues.length
    ? Math.min(...priceValues)
    : undefined;
  const derivedMaxPrice = priceValues.length
    ? Math.max(...priceValues)
    : undefined;

  const sliderMin = isValidPrice(serverMinPrice)
    ? serverMinPrice
    : (derivedMinPrice ?? 0);

  const sliderMaxCandidate = isValidPrice(serverMaxPrice)
    ? serverMaxPrice
    : (derivedMaxPrice ?? sliderMin);

  const sliderMax =
    sliderMaxCandidate >= sliderMin ? sliderMaxCandidate : sliderMin;
  const hasPriceData = priceValues.length > 0 || isValidPrice(serverMaxPrice);

  const normalizedInitialRange = useMemo<[number, number]>(() => {
    const parsedMin = initialParams.minPrice
      ? parseFloat(initialParams.minPrice)
      : sliderMin;
    const parsedMax = initialParams.maxPrice
      ? parseFloat(initialParams.maxPrice)
      : sliderMax;

    const safeMin = Number.isFinite(parsedMin) ? parsedMin : sliderMin;
    const safeMax = Number.isFinite(parsedMax) ? parsedMax : sliderMax;

    const clampedMin = clamp(safeMin, sliderMin, sliderMax);
    const clampedMax = clamp(safeMax, clampedMin, sliderMax);

    return [clampedMin, clampedMax];
  }, [initialParams.minPrice, initialParams.maxPrice, sliderMin, sliderMax]);

  const [priceRange, setPriceRange] = useState<[number, number]>(
    normalizedInitialRange,
  );

  useEffect(() => {
    setPriceRange((previous) => {
      if (
        previous[0] === normalizedInitialRange[0] &&
        previous[1] === normalizedInitialRange[1]
      ) {
        return previous;
      }
      return normalizedInitialRange;
    });
  }, [normalizedInitialRange]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialParams.categories?.split(",").filter(Boolean) ?? [],
  );
  const [sortBy, setSortBy] = useState(initialParams.sort ?? "relevance");

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    startTransition(() => {
      router.push(`/produtos?${params.toString()}`, { scroll: false });
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    updateFilters({ search: value || undefined });
  };

  const handlePriceChange = (values: number[]) => {
    const [min, max] = values;
    const nextMin = Number(min.toFixed(2));
    const nextMax = Number(max.toFixed(2));
    const hasAdjustableRange = sliderMax > sliderMin;

    setPriceRange([nextMin, nextMax]);

    updateFilters({
      minPrice:
        hasAdjustableRange && nextMin > sliderMin
          ? nextMin.toFixed(2)
          : undefined,
      maxPrice:
        hasAdjustableRange && nextMax < sliderMax
          ? nextMax.toFixed(2)
          : undefined,
    });
  };

  const toggleCategory = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];

    setSelectedCategories(newCategories);
    updateFilters({
      categories:
        newCategories.length > 0 ? newCategories.join(",") : undefined,
    });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    updateFilters({ sort: value !== "relevance" ? value : undefined });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setPriceRange([sliderMin, sliderMax]);
    setSelectedCategories([]);
    setSortBy("relevance");
    router.push("/produtos");
  };

  const getCategoryProductCount = (categoryId: string) => {
    return initialProducts.filter(
      (p) => p.product_templates.category_id === categoryId,
    ).length;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wide text-[var(--color-base-400)]">
            {initialProducts.length} produtos encontrados
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-4 border border-dashed border-[var(--color-base-500)] rounded-[4px]">
              {/* FILTROS Header */}
              <div className="px-4 pt-4 pb-3 border-b border-dashed border-[var(--color-base-500)]">
                <h2 className="text-xs font-medium uppercase tracking-wide">
                  Filtros
                </h2>
              </div>

              {/* Search */}
              <div className="px-4 pt-4 pb-4 border-b border-dashed border-[var(--color-base-500)]">
                <Label
                  htmlFor="search"
                  className="block mb-2 text-xs uppercase tracking-wide text-foreground"
                >
                  Pesquisar
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-base-400)]">
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
                    className="h-8 pl-9 pr-3 text-xs border border-dashed border-[var(--color-base-500)] bg-transparent rounded-[4px] transition-colors duration-150 ease-out focus-visible:bg-background focus-visible:border-[var(--accent-100)] focus-visible:ring-0 focus-visible:outline-none placeholder:text-[var(--color-base-400)]"
                  />
                </div>
              </div>

              {/* Price Range */}
              <div className="px-4 pt-4 pb-4 border-b border-dashed border-[var(--color-base-500)]">
                <Label className="block mb-3 text-xs uppercase tracking-wide text-foreground">
                  Preço
                </Label>
                <div className="mt-2 mb-2">
                  <Slider
                    value={priceRange}
                    min={sliderMin}
                    max={sliderMax}
                    step={0.01}
                    onValueChange={handlePriceChange}
                    disabled={sliderMax === sliderMin}
                    className="
                      [&_[data-orientation=horizontal]]:h-[2px]
                      [&_[data-orientation=horizontal]]:bg-[var(--color-base-500)]
                      [&_[data-orientation=horizontal]_[data-state=on]]:bg-[var(--accent-100)]
                      [&_[role=slider]]:h-3
                      [&_[role=slider]]:w-3
                      [&_[role=slider]]:bg-background
                      [&_[role=slider]]:border
                      [&_[role=slider]]:border-dashed
                      [&_[role=slider]]:border-[var(--accent-100)]
                      [&_[role=slider]]:shadow-none
                      [&_[role=slider]]:rounded-[2px]
                    "
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-[var(--color-base-400)]">
                  <span>
                    {hasPriceData ? priceRange[0].toFixed(2) : "0.00"} €
                  </span>
                  <span>
                    {hasPriceData ? priceRange[1].toFixed(2) : "0.00"} €
                  </span>
                </div>
              </div>

              {/* Categories */}
              <div className="px-4 pt-4 pb-4">
                <Label className="block mb-3 text-xs uppercase tracking-wide text-foreground">
                  Categorias
                </Label>
                <div className="flex flex-col gap-1">
                  {categories.map((category) => {
                    const count = getCategoryProductCount(category.id);
                    const isSelected = selectedCategories.includes(category.id);
                    const isDisabled = count === 0;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() =>
                          !isDisabled && toggleCategory(category.id)
                        }
                        className={[
                          "flex items-center justify-between w-full px-2 py-2 text-left border border-dashed bg-transparent rounded-[4px]",
                          "transition-colors duration-150 ease-out",
                          "gap-2",
                          isDisabled
                            ? "opacity-40 cursor-not-allowed border-transparent"
                            : "cursor-pointer hover:border-[var(--color-base-400)]",
                          isSelected
                            ? "border-[var(--accent-100)]"
                            : "border-transparent",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "flex items-center justify-center w-3.5 h-3.5 border border-dashed bg-transparent rounded-[2px]",
                              "transition-colors duration-150",
                              isSelected
                                ? "border-[var(--accent-100)]"
                                : "border-[var(--color-base-500)]",
                              isDisabled
                                ? "border-[var(--color-base-600)]"
                                : "",
                            ].join(" ")}
                          >
                            {isSelected && (
                              <svg
                                width="8"
                                height="6"
                                viewBox="0 0 11 8"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ color: "var(--accent-100)" }}
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
                              isSelected
                                ? "text-[var(--accent-100)]"
                                : "text-foreground",
                            ].join(" ")}
                          >
                            {category.name}
                          </span>
                        </div>
                        <span
                          className={[
                            "text-xs tabular-nums",
                            isSelected
                              ? "text-[var(--accent-100)]"
                              : "text-[var(--color-base-400)]",
                          ].join(" ")}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="px-4 pb-4 pt-3 border-t border-dashed border-[var(--color-base-500)]">
                <Button
                  variant="outline"
                  className="w-full h-8"
                  onClick={handleClearFilters}
                >
                  Limpar filtros
                </Button>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            {/* Sort dropdown */}
            <div className="flex justify-end mb-4">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="sort"
                  className="text-xs uppercase tracking-wide text-[var(--color-base-400)]"
                >
                  Ordenar:
                </Label>
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger
                    id="sort"
                    className="w-36 h-8 text-xs border border-dashed border-[var(--color-base-500)] rounded-[4px] bg-transparent"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-dashed border-[var(--color-base-500)] rounded-[4px]">
                    <SelectItem value="relevance" className="text-xs">
                      Relevância
                    </SelectItem>
                    <SelectItem value="name" className="text-xs">
                      Nome
                    </SelectItem>
                    <SelectItem value="price-asc" className="text-xs">
                      Preço: Menor
                    </SelectItem>
                    <SelectItem value="price-desc" className="text-xs">
                      Preço: Maior
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Loading overlay */}
            {isPending && (
              <div className="fixed inset-0 bg-background/50 z-50 flex items-center justify-center">
                <p className="text-xs uppercase tracking-wide text-[var(--color-base-400)]">
                  A atualizar...
                </p>
              </div>
            )}

            {/* Products grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {initialProducts.map((product) => (
                <Link key={product.id} href={`/produtos/${product.url_slug}`}>
                  <div className="group h-full flex flex-col border border-dashed border-[var(--color-base-500)] rounded-[4px] overflow-hidden transition-colors hover:border-[var(--accent-100)] bg-card">
                    <div className="relative aspect-square border-b border-dashed border-[var(--color-base-500)] group-hover:border-[var(--accent-100)] transition-colors overflow-hidden">
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
                          <span className="text-xs text-[var(--color-base-400)]">
                            Sem imagem
                          </span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary">
                          {product.size_formats.name}
                        </Badge>
                      </div>
                      {product.is_bestseller && (
                        <div className="absolute top-2 right-2">
                          <Badge>Bestseller</Badge>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <p className="text-xs text-[var(--color-base-400)] mb-1 uppercase tracking-wide">
                        {product.sku}
                      </p>
                      <h3 className="text-sm font-medium mb-2 line-clamp-2 uppercase tracking-wide">
                        {product.product_templates.name}
                      </h3>
                      <div className="mt-auto">
                        <p
                          className="text-lg"
                          style={{ color: "var(--accent-100)" }}
                        >
                          desde {product.base_price_including_vat.toFixed(2)} €
                        </p>
                        <p className="text-xs text-[var(--color-base-400)]">
                          {(product.base_price_including_vat / 1.23).toFixed(2)}{" "}
                          € (s/IVA)
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {initialProducts.length === 0 && (
              <div className="text-center py-8 border border-dashed border-[var(--color-base-500)] rounded-[4px]">
                <p className="text-[var(--color-base-400)] text-sm">
                  Nenhum produto encontrado com os filtros selecionados.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
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
  );
}
