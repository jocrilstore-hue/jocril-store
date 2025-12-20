"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  FolderTree,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  product_count?: number;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parent_id: number | null;
  is_active: boolean;
}

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export function CategoriesEditor() {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
    description: "",
    parent_id: null,
    is_active: true,
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch categories with product count
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select(
          "id, name, slug, parent_id, description, display_order, is_active",
        )
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (categoriesError) throw categoriesError;

      // Fetch product counts per category
      const { data: countData, error: countError } = await supabase
        .from("product_templates")
        .select("category_id")
        .not("category_id", "is", null);

      if (countError) throw countError;

      // Count products per category
      const productCounts: Record<number, number> = {};
      countData?.forEach((item) => {
        if (item.category_id) {
          productCounts[item.category_id] =
            (productCounts[item.category_id] || 0) + 1;
        }
      });

      // Merge counts into categories
      const categoriesWithCounts = (categoriesData || []).map((cat) => ({
        ...cat,
        product_count: productCounts[cat.id] || 0,
      }));

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Build hierarchical structure for display
  const hierarchicalCategories = useMemo(() => {
    const result: Array<Category & { level: number }> = [];
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // Find root categories (no parent)
    const roots = categories.filter((c) => !c.parent_id);

    const addWithChildren = (category: Category, level: number) => {
      result.push({ ...category, level });
      const children = categories.filter((c) => c.parent_id === category.id);
      children.forEach((child) => addWithChildren(child, level + 1));
    };

    roots.forEach((root) => addWithChildren(root, 0));

    return result;
  }, [categories]);

  // Get valid parent options (exclude self and descendants)
  const getValidParentOptions = useCallback(
    (excludeId?: number) => {
      if (!excludeId) return categories.filter((c) => c.is_active);

      const descendantIds = new Set<number>();

      const findDescendants = (parentId: number) => {
        descendantIds.add(parentId);
        categories
          .filter((c) => c.parent_id === parentId)
          .forEach((c) => findDescendants(c.id));
      };

      findDescendants(excludeId);

      return categories.filter((c) => !descendantIds.has(c.id) && c.is_active);
    },
    [categories],
  );

  const openCreateForm = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      parent_id: null,
      is_active: true,
    });
    setSlugManuallyEdited(false);
    setIsFormOpen(true);
  };

  const openEditForm = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      parent_id: category.parent_id,
      is_active: category.is_active,
    });
    setSlugManuallyEdited(true); // Don't auto-update slug when editing
    setIsFormOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: slugManuallyEdited ? prev.slug : generateSlug(name),
    }));
  };

  const handleSlugChange = (slug: string) => {
    setSlugManuallyEdited(true);
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.slug.trim()) {
      toast({
        title: "Erro",
        description: "O slug é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        parent_id: formData.parent_id,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      };

      if (editingCategory) {
        // Update existing
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingCategory.id);

        if (error) throw error;

        toast({
          title: "Categoria atualizada",
          description: `"${formData.name}" foi atualizada com sucesso.`,
        });
      } else {
        // Create new
        const { error } = await supabase
          .from("categories")
          .insert({ ...payload, created_at: new Date().toISOString() });

        if (error) throw error;

        toast({
          title: "Categoria criada",
          description: `"${formData.name}" foi criada com sucesso.`,
        });
      }

      setIsFormOpen(false);
      await fetchCategories();
    } catch (error: unknown) {
      console.error("Error saving category:", error);
      const message =
        error instanceof Error && error.message.includes("duplicate")
          ? "Já existe uma categoria com este slug."
          : "Não foi possível guardar a categoria.";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    setSaving(true);

    try {
      // Check for child categories
      const hasChildren = categories.some(
        (c) => c.parent_id === deletingCategory.id,
      );
      if (hasChildren) {
        toast({
          title: "Não é possível eliminar",
          description: "Esta categoria tem subcategorias. Remova-as primeiro.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", deletingCategory.id);

      if (error) throw error;

      toast({
        title: "Categoria eliminada",
        description: `"${deletingCategory.name}" foi eliminada.`,
      });

      setIsDeleteOpen(false);
      setDeletingCategory(null);
      await fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Erro",
        description: "Não foi possível eliminar a categoria.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Categorias</h3>
          <Badge variant="secondary">{categories.length}</Badge>
        </div>
        <Button size="sm" onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="text-center">Produtos</TableHead>
              <TableHead className="text-center">Ordem</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">
                  <span className="text-muted-foreground">A carregar...</span>
                </TableCell>
              </TableRow>
            ) : hierarchicalCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">
                  <span className="text-muted-foreground">
                    Nenhuma categoria encontrada.
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              hierarchicalCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div
                      className="flex items-center gap-1"
                      style={{ paddingLeft: `${category.level * 24}px` }}
                    >
                      {category.level > 0 && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span
                        className={cn(
                          !category.is_active && "text-muted-foreground",
                        )}
                      >
                        {category.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {category.product_count || 0}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {category.display_order}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={category.is_active ? "default" : "secondary"}
                      className={cn(
                        category.is_active
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {category.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditForm(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Atualize os dados da categoria."
                : "Preencha os dados para criar uma nova categoria."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nome *</Label>
              <Input
                id="cat-name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Porta-folhetos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug *</Label>
              <Input
                id="cat-slug"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="porta-folhetos"
              />
              <p className="text-xs text-muted-foreground">
                URL: /categorias/{formData.slug || "..."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-description">Descrição</Label>
              <Textarea
                id="cat-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Descrição opcional da categoria..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-parent">Categoria Pai</Label>
              <Select
                value={formData.parent_id?.toString() || "none"}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    parent_id: value === "none" ? null : parseInt(value),
                  }))
                }
              >
                <SelectTrigger id="cat-parent">
                  <SelectValue placeholder="Nenhuma (raiz)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (raiz)</SelectItem>
                  {getValidParentOptions(editingCategory?.id).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="cat-active">Ativa</Label>
                <p className="text-xs text-muted-foreground">
                  Categorias inativas não aparecem no site.
                </p>
              </div>
              <Switch
                id="cat-active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_active: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingCategory && deletingCategory.product_count ? (
                <>
                  <span className="font-semibold text-destructive">
                    Atenção:
                  </span>{" "}
                  Esta categoria está atribuída a{" "}
                  <strong>{deletingCategory.product_count}</strong> produto(s).
                  Ao eliminar, esses produtos ficarão sem categoria.
                </>
              ) : (
                <>
                  Tem a certeza que pretende eliminar &quot;
                  {deletingCategory?.name}&quot;? Esta ação não pode ser
                  revertida.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? "A eliminar..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
