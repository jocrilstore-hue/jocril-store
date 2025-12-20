"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

interface Material {
  id: number;
  name: string;
  description: string | null;
  thickness: string | null;
  is_active: boolean;
  product_count?: number;
}

interface MaterialFormData {
  name: string;
  description: string;
  thickness: string;
  is_active: boolean;
}

export function MaterialsEditor() {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(
    null,
  );

  // Form state
  const [formData, setFormData] = useState<MaterialFormData>({
    name: "",
    description: "",
    thickness: "",
    is_active: true,
  });

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch materials
      const { data: materialsData, error: materialsError } = await supabase
        .from("materials")
        .select("id, name, description, thickness, is_active")
        .order("name", { ascending: true });

      if (materialsError) throw materialsError;

      // Fetch product counts per material
      const { data: countData, error: countError } = await supabase
        .from("product_templates")
        .select("material_id")
        .not("material_id", "is", null);

      if (countError) throw countError;

      // Count products per material
      const productCounts: Record<number, number> = {};
      countData?.forEach((item) => {
        if (item.material_id) {
          productCounts[item.material_id] =
            (productCounts[item.material_id] || 0) + 1;
        }
      });

      // Merge counts into materials
      const materialsWithCounts = (materialsData || []).map((mat) => ({
        ...mat,
        product_count: productCounts[mat.id] || 0,
      }));

      setMaterials(materialsWithCounts);
    } catch (error) {
      console.error("Error fetching materials:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os materiais.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const openCreateForm = () => {
    setEditingMaterial(null);
    setFormData({
      name: "",
      description: "",
      thickness: "",
      is_active: true,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      description: material.description || "",
      thickness: material.thickness || "",
      is_active: material.is_active,
    });
    setIsFormOpen(true);
  };

  const openDeleteDialog = (material: Material) => {
    setDeletingMaterial(material);
    setIsDeleteOpen(true);
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

    setSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        thickness: formData.thickness.trim() || null,
        is_active: formData.is_active,
      };

      if (editingMaterial) {
        // Update existing
        const { error } = await supabase
          .from("materials")
          .update(payload)
          .eq("id", editingMaterial.id);

        if (error) throw error;

        toast({
          title: "Material atualizado",
          description: `"${formData.name}" foi atualizado com sucesso.`,
        });
      } else {
        // Create new
        const { error } = await supabase
          .from("materials")
          .insert({ ...payload, created_at: new Date().toISOString() });

        if (error) throw error;

        toast({
          title: "Material criado",
          description: `"${formData.name}" foi criado com sucesso.`,
        });
      }

      setIsFormOpen(false);
      await fetchMaterials();
    } catch (error: unknown) {
      console.error("Error saving material:", error);
      const message =
        error instanceof Error && error.message.includes("duplicate")
          ? "Já existe um material com este nome."
          : "Não foi possível guardar o material.";
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
    if (!deletingMaterial) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("materials")
        .delete()
        .eq("id", deletingMaterial.id);

      if (error) throw error;

      toast({
        title: "Material eliminado",
        description: `"${deletingMaterial.name}" foi eliminado.`,
      });

      setIsDeleteOpen(false);
      setDeletingMaterial(null);
      await fetchMaterials();
    } catch (error) {
      console.error("Error deleting material:", error);
      toast({
        title: "Erro",
        description: "Não foi possível eliminar o material.",
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
          <Layers className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Materiais</h3>
          <Badge variant="secondary">{materials.length}</Badge>
        </div>
        <Button size="sm" onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Material
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="text-center">Espessura</TableHead>
              <TableHead className="text-center">Produtos</TableHead>
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
            ) : materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">
                  <span className="text-muted-foreground">
                    Nenhum material encontrado.
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>
                    <span
                      className={cn(
                        "font-medium",
                        !material.is_active && "text-muted-foreground",
                      )}
                    >
                      {material.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {material.thickness ? (
                      <span className="text-sm">{material.thickness}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {material.product_count || 0}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={material.is_active ? "default" : "secondary"}
                      className={cn(
                        material.is_active
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {material.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditForm(material)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(material)}
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
              {editingMaterial ? "Editar Material" : "Novo Material"}
            </DialogTitle>
            <DialogDescription>
              {editingMaterial
                ? "Atualize os dados do material."
                : "Preencha os dados para criar um novo material."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mat-name">Nome *</Label>
              <Input
                id="mat-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Acrílico Cristal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mat-description">Descrição</Label>
              <Textarea
                id="mat-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Descrição opcional do material..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mat-thickness">Espessura</Label>
              <Input
                id="mat-thickness"
                value={formData.thickness}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    thickness: e.target.value,
                  }))
                }
                placeholder="Ex: 3mm, 5mm"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="mat-active">Ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Materiais inativos não aparecem nos filtros.
                </p>
              </div>
              <Switch
                id="mat-active"
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
            <AlertDialogTitle>Eliminar material?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingMaterial && deletingMaterial.product_count ? (
                <>
                  <span className="font-semibold text-destructive">
                    Atenção:
                  </span>{" "}
                  Este material está atribuído a{" "}
                  <strong>{deletingMaterial.product_count}</strong> produto(s).
                  Ao eliminar, esses produtos ficarão sem material.
                </>
              ) : (
                <>
                  Tem a certeza que pretende eliminar &quot;
                  {deletingMaterial?.name}&quot;? Esta ação não pode ser
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
