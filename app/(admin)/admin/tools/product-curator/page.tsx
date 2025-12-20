"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  ChevronDown,
  ChevronRight,
  Download,
  Upload,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
} from "lucide-react";

// Types
interface Variation {
  name: string;
  attribute_type: string;
  price: string;
  sku: string;
  stock_status: string;
  url_fragment: string;
  // Enrichment fields
  _keep?: boolean;
  _notes?: string;
}

interface Product {
  id: string;
  name: string;
  url: string;
  category_id: string;
  description: string;
  images: string[];
  base_price: string;
  manufacturer: string;
  variations: Variation[];
  // Enrichment fields
  _keep?: boolean;
  _notes?: string;
  _newCategory?: string;
  _shortDescription?: string;
  _advantages?: string;
  _idealFor?: string;
  // Internal tracking - stable index that persists across updates
  _dataIndex?: number;
}

interface Category {
  id: string;
  name: string;
  url: string;
  description: string;
  parent_id: string | null;
}

interface SourceData {
  categories: Category[];
  products: Product[];
}

const STORAGE_KEY = "product-curator-data";

export default function ProductCuratorPage() {
  const [data, setData] = useState<SourceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "keep" | "remove">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
    new Set(),
  );
  const [showOnlyWithVariations, setShowOnlyWithVariations] = useState(false);
  const [stats, setStats] = useState({ total: 0, kept: 0, removed: 0 });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<
    "default" | "name-asc" | "name-desc"
  >("default");

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // AUTO-SAVE to localStorage whenever data changes
  useEffect(() => {
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(
        `${STORAGE_KEY}-timestamp`,
        new Date().toISOString(),
      );
      setLastSaved(new Date());
    }
  }, [data]);

  // Update stats when data changes
  useEffect(() => {
    if (data) {
      const kept = data.products.filter((p) => p._keep !== false).length;
      setStats({
        total: data.products.length,
        kept,
        removed: data.products.length - kept,
      });
    }
  }, [data]);

  const loadData = async () => {
    try {
      // FIRST: Try to load from localStorage (auto-saved data)
      const savedData = localStorage.getItem(STORAGE_KEY);
      const savedTimestamp = localStorage.getItem(`${STORAGE_KEY}-timestamp`);

      if (savedData) {
        const parsed = JSON.parse(savedData) as SourceData;
        // Ensure _dataIndex exists on all products (might be missing from old saves)
        parsed.products = parsed.products.map((p, idx) => ({
          ...p,
          _dataIndex: p._dataIndex ?? idx,
        }));
        setData(parsed);
        if (savedTimestamp) {
          setLastSaved(new Date(savedTimestamp));
        }
        console.log("Loaded from localStorage (auto-saved)");
        setLoading(false);
        return;
      }

      // FALLBACK: Load from source JSON file (256 products, no duplicates)
      const response = await fetch("/TEMP/estudioplast_20251130_093506.json");
      const jsonData: SourceData = await response.json();

      // Initialize enrichment fields if not present
      // CRITICAL: Assign _dataIndex here so it's stable across state updates
      jsonData.products = jsonData.products.map((p, idx) => ({
        ...p,
        _keep: p._keep ?? true,
        _notes: p._notes ?? "",
        _newCategory: p._newCategory ?? p.category_id,
        _shortDescription: p._shortDescription ?? "",
        _advantages: p._advantages ?? "",
        _idealFor: p._idealFor ?? "",
        _dataIndex: idx, // Stable index - assigned once at load time
        variations: p.variations.map((v) => ({
          ...v,
          _keep: v._keep ?? true,
          _notes: v._notes ?? "",
        })),
      }));

      setData(jsonData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearLocalStorage = () => {
    if (
      confirm(
        "This will clear all your saved progress and reload from the original JSON file. Are you sure?",
      )
    ) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(`${STORAGE_KEY}-timestamp`);
      setLastSaved(null);
      window.location.reload();
    }
  };

  // Use productIndex instead of productId because there are duplicate IDs in the source data
  const toggleProduct = (productIndex: number) => {
    if (!data) return;
    setData({
      ...data,
      products: data.products.map((p, idx) =>
        idx === productIndex ? { ...p, _keep: !p._keep } : p,
      ),
    });
  };

  const toggleVariation = (productIndex: number, variationIndex: number) => {
    if (!data) return;
    setData({
      ...data,
      products: data.products.map((p, idx) =>
        idx === productIndex
          ? {
              ...p,
              variations: p.variations.map((v, i) =>
                i === variationIndex ? { ...v, _keep: !v._keep } : v,
              ),
            }
          : p,
      ),
    });
  };

  const updateProductField = (
    productIndex: number,
    field: keyof Product,
    value: string,
  ) => {
    if (!data) return;
    setData({
      ...data,
      products: data.products.map((p, idx) =>
        idx === productIndex ? { ...p, [field]: value } : p,
      ),
    });
  };

  const updateVariationNotes = (
    productIndex: number,
    variationIndex: number,
    notes: string,
  ) => {
    if (!data) return;
    setData({
      ...data,
      products: data.products.map((p, idx) =>
        idx === productIndex
          ? {
              ...p,
              variations: p.variations.map((v, i) =>
                i === variationIndex ? { ...v, _notes: notes } : v,
              ),
            }
          : p,
      ),
    });
  };

  const toggleExpanded = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const expandAll = () => {
    if (!data) return;
    setExpandedProducts(new Set(data.products.map((p) => p.id)));
  };

  const collapseAll = () => {
    setExpandedProducts(new Set());
  };

  const exportData = () => {
    if (!data) return;

    // Export ALL products with ALL enrichment fields (keep/remove status preserved)
    // This is your working file - you can import it back to restore your work
    const exportPayload = {
      categories: data.categories,
      products: data.products.map((p) => ({
        // Original fields
        id: p.id,
        name: p.name,
        url: p.url,
        category_id: p.category_id,
        description: p.description,
        images: p.images,
        base_price: p.base_price,
        manufacturer: p.manufacturer,
        // ALL enrichment fields - explicitly listed so nothing is missed
        _keep: p._keep,
        _notes: p._notes,
        _newCategory: p._newCategory,
        _shortDescription: p._shortDescription,
        _advantages: p._advantages,
        _idealFor: p._idealFor,
        // Variations with their enrichment fields
        variations: p.variations.map((v) => ({
          name: v.name,
          attribute_type: v.attribute_type,
          price: v.price,
          sku: v.sku,
          stock_status: v.stock_status,
          url_fragment: v.url_fragment,
          // Variation enrichment fields
          _keep: v._keep,
          _notes: v._notes,
        })),
      })),
      _exportedAt: new Date().toISOString(),
      _stats: stats,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estudioplast_curated_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert(
      `Exported ${data.products.length} products. Use "Import File" to restore this data.`,
    );
  };

  // Export ONLY kept products (for AI processing / final import)
  const exportKeptOnly = () => {
    if (!data) return;

    const keptProducts = data.products.filter((p) => p._keep !== false);

    const exportPayload = {
      categories: data.categories,
      products: keptProducts.map((p) => ({
        id: p.id,
        name: p.name,
        url: p.url,
        category_id: p.category_id,
        description: p.description,
        images: p.images,
        base_price: p.base_price,
        manufacturer: p.manufacturer,
        _keep: p._keep,
        _notes: p._notes,
        _newCategory: p._newCategory,
        _shortDescription: p._shortDescription,
        _advantages: p._advantages,
        _idealFor: p._idealFor,
        variations: p.variations
          .filter((v) => v._keep !== false)
          .map((v) => ({
            name: v.name,
            attribute_type: v.attribute_type,
            price: v.price,
            sku: v.sku,
            stock_status: v.stock_status,
            url_fragment: v.url_fragment,
            _keep: v._keep,
            _notes: v._notes,
          })),
      })),
      _exportedAt: new Date().toISOString(),
      _stats: {
        total: keptProducts.length,
        kept: keptProducts.length,
        removed: 0,
      },
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estudioplast_kept_only_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert(
      `Exported ${keptProducts.length} kept products (removed products excluded).`,
    );
  };

  const downloadBackup = () => {
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estudioplast_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // IMPORT: Load data from uploaded file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content);

        // Validate structure - must have categories and products
        if (!imported.categories || !Array.isArray(imported.categories)) {
          throw new Error("Invalid file: missing 'categories' array");
        }
        if (!imported.products || !Array.isArray(imported.products)) {
          throw new Error("Invalid file: missing 'products' array");
        }

        // Ensure all enrichment fields exist on every product/variation
        // CRITICAL: Assign _dataIndex here so it's stable across state updates
        const enrichedData: SourceData = {
          categories: imported.categories,
          products: imported.products.map((p: Product, idx: number) => ({
            ...p,
            _keep: p._keep ?? true,
            _notes: p._notes ?? "",
            _newCategory: p._newCategory ?? p.category_id,
            _shortDescription: p._shortDescription ?? "",
            _advantages: p._advantages ?? "",
            _idealFor: p._idealFor ?? "",
            _dataIndex: idx, // Stable index - assigned once at import time
            variations: (p.variations || []).map((v: Variation) => ({
              ...v,
              _keep: v._keep ?? true,
              _notes: v._notes ?? "",
            })),
          })),
        };

        // Save to state and localStorage
        setData(enrichedData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(enrichedData));
        localStorage.setItem(
          `${STORAGE_KEY}-timestamp`,
          new Date().toISOString(),
        );
        setLastSaved(new Date());

        alert(
          `Successfully imported ${enrichedData.products.length} products!`,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to parse file";
        setImportError(message);
        alert(`Import failed: ${message}`);
      }
    };

    reader.onerror = () => {
      setImportError("Failed to read file");
      alert("Failed to read file");
    };

    reader.readAsText(file);

    // Reset input so same file can be selected again
    event.target.value = "";
  };

  const markAllAsRemove = () => {
    if (!data) return;
    setData({
      ...data,
      products: data.products.map((p) => ({ ...p, _keep: false })),
    });
  };

  const markAllAsKeep = () => {
    if (!data) return;
    setData({
      ...data,
      products: data.products.map((p) => ({ ...p, _keep: true })),
    });
  };

  const parsePrice = (priceStr: string): number => {
    // "2,88 €" -> 2.88
    return parseFloat(priceStr.replace("€", "").replace(",", ".").trim()) || 0;
  };

  const filtered = data?.products.filter((p) => {
    // Filter by keep status
    if (filter === "keep" && p._keep === false) return false;
    if (filter === "remove" && p._keep !== false) return false;

    // Filter by search
    if (
      searchTerm &&
      !p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Filter by category
    if (categoryFilter !== "all" && p._newCategory !== categoryFilter) {
      return false;
    }

    // Filter by variations
    if (showOnlyWithVariations && p.variations.length <= 1) {
      return false;
    }

    return true;
  });

  // Use the stable _dataIndex that was assigned at load/import time
  // This avoids the indexOf reference comparison bug that caused data loss
  const filteredWithIndex = filtered?.map((p) => ({
    ...p,
    _originalIndex: p._dataIndex!, // Use stable index, not indexOf
  }));

  const filteredProducts = filteredWithIndex?.sort((a, b) => {
    if (sortOrder === "name-asc") {
      return a.name.localeCompare(b.name, "pt");
    }
    if (sortOrder === "name-desc") {
      return b.name.localeCompare(a.name, "pt");
    }
    return 0; // default - keep original order
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading product data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">
          Failed to load data. Make sure the JSON file exists in public/TEMP/
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Curator</h1>
          <p className="text-muted-foreground">
            Review, filter, and enrich product data for import
          </p>
          {lastSaved && (
            <p className="text-xs text-green-600 mt-1">
              Auto-saved to browser: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {/* Hidden file input for import */}
          <input
            type="file"
            id="import-file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => {
              if (
                confirm(
                  "Reset and reload from source file? This clears all your changes.",
                )
              ) {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(`${STORAGE_KEY}-timestamp`);
                window.location.reload();
              }
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={() => document.getElementById("import-file")?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            onClick={exportKeptOnly}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export ({stats.kept})
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4 p-4 bg-muted rounded-lg">
        <Badge variant="outline" className="text-sm">
          Total: {stats.total}
        </Badge>
        <Badge variant="default" className="text-sm bg-green-600">
          Keep: {stats.kept}
        </Badge>
        <Badge variant="destructive" className="text-sm">
          Remove: {stats.removed}
        </Badge>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={markAllAsKeep}>
          Keep All
        </Button>
        <Button variant="ghost" size="sm" onClick={markAllAsRemove}>
          Remove All
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as typeof filter)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="keep">Keep Only</SelectItem>
              <SelectItem value="remove">Remove Only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {data.categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortOrder}
            onValueChange={(v) => setSortOrder(v as typeof sortOrder)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Order</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Checkbox
              id="variations"
              checked={showOnlyWithVariations}
              onCheckedChange={(c) => setShowOnlyWithVariations(c === true)}
            />
            <Label htmlFor="variations" className="text-sm">
              Has variations
            </Label>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product List */}
      <div className="space-y-4">
        {filteredProducts?.map((product, productIndex) => {
          const isExpanded = expandedProducts.has(product.id);
          const keptVariations = product.variations.filter(
            (v) => v._keep !== false,
          ).length;
          const category = data.categories.find(
            (c) => c.id === product._newCategory,
          );

          return (
            <Card
              key={`${product.id}-${productIndex}`}
              className={product._keep === false ? "opacity-50" : ""}
            >
              <Collapsible open={isExpanded}>
                <CardHeader className="py-3">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 flex-shrink-0 bg-muted rounded overflow-hidden">
                      {product.images[0] && (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CollapsibleTrigger
                          onClick={() => toggleExpanded(product.id)}
                          className="hover:bg-muted p-1 rounded"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </CollapsibleTrigger>
                        <CardTitle className="text-base truncate">
                          {product.name}
                        </CardTitle>
                      </div>
                      <CardDescription className="mt-1">
                        <span className="font-mono text-xs">
                          ID: {product.id}
                        </span>
                        {" • "}
                        <span>{category?.name || "Unknown"}</span>
                        {" • "}
                        <span>{product.base_price}</span>
                        {" • "}
                        <span>
                          {keptVariations}/{product.variations.length}{" "}
                          variations
                        </span>
                      </CardDescription>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant={
                          product._keep === false ? "outline" : "default"
                        }
                        size="sm"
                        onClick={() => toggleProduct(product._originalIndex)}
                        className={
                          product._keep === false
                            ? ""
                            : "bg-green-600 hover:bg-green-700"
                        }
                      >
                        {product._keep === false ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" /> Removed
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" /> Keep
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    {/* Original Description */}
                    <div className="p-3 bg-muted/50 rounded text-sm">
                      <div className="font-medium mb-1">
                        Original Description:
                      </div>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {product.description || "(empty)"}
                      </p>
                    </div>

                    {/* Enrichment Fields */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-xs">Category</Label>
                        <Select
                          value={product._newCategory}
                          onValueChange={(v) =>
                            updateProductField(
                              product._originalIndex,
                              "_newCategory",
                              v,
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {data.categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Short Description</Label>
                        <Input
                          placeholder="Brief description for listings..."
                          value={product._shortDescription}
                          onChange={(e) =>
                            updateProductField(
                              product._originalIndex,
                              "_shortDescription",
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Advantages</Label>
                        <Textarea
                          placeholder="Key benefits and features..."
                          value={product._advantages}
                          onChange={(e) =>
                            updateProductField(
                              product._originalIndex,
                              "_advantages",
                              e.target.value,
                            )
                          }
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Ideal For</Label>
                        <Textarea
                          placeholder="Target use cases and customers..."
                          value={product._idealFor}
                          onChange={(e) =>
                            updateProductField(
                              product._originalIndex,
                              "_idealFor",
                              e.target.value,
                            )
                          }
                          rows={2}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-xs">Notes for AI</Label>
                        <Textarea
                          placeholder="Additional context, corrections, or instructions for AI content generation..."
                          value={product._notes}
                          onChange={(e) =>
                            updateProductField(
                              product._originalIndex,
                              "_notes",
                              e.target.value,
                            )
                          }
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Variations */}
                    {product.variations.length > 0 && (
                      <div>
                        <Label className="text-xs mb-2 block">Variations</Label>
                        <div className="space-y-2">
                          {product.variations.map((variation, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-3 p-2 rounded border ${
                                variation._keep === false
                                  ? "opacity-50 bg-muted/30"
                                  : "bg-background"
                              }`}
                            >
                              <Checkbox
                                checked={variation._keep !== false}
                                onCheckedChange={() =>
                                  toggleVariation(product._originalIndex, idx)
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {variation.name}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {variation.price}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {variation.sku}
                                  </span>
                                </div>
                              </div>
                              <Input
                                placeholder="Notes..."
                                value={variation._notes}
                                onChange={(e) =>
                                  updateVariationNotes(
                                    product._originalIndex,
                                    idx,
                                    e.target.value,
                                  )
                                }
                                className="w-48 h-8 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Images */}
                    {product.images.length > 1 && (
                      <div>
                        <Label className="text-xs mb-2 block">All Images</Label>
                        <div className="flex gap-2 flex-wrap">
                          {product.images.map((img, idx) => (
                            <div
                              key={idx}
                              className="relative w-24 h-24 bg-muted rounded overflow-hidden"
                            >
                              <Image
                                src={img}
                                alt={`${product.name} ${idx + 1}`}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProducts?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No products match your filters
        </div>
      )}
    </div>
  );
}
