"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Plus, Pencil, Trash2, RefreshCw, AlertCircle, Package } from "lucide-react"
import type { ShippingClass } from "@/lib/types/shipping"
import { formatWeight } from "@/lib/types/shipping"
import { ClassEditModal } from "./class-edit-modal"

export function ShippingClassesTable() {
  const [classes, setClasses] = useState<ShippingClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingClass, setEditingClass] = useState<ShippingClass | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  const fetchClasses = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/shipping/classes")
      if (!response.ok) throw new Error("Erro ao carregar classes")
      const data = await response.json()
      if (data.success) {
        setClasses(data.data)
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const handleToggleActive = async (shippingClass: ShippingClass) => {
    try {
      const response = await fetch("/api/admin/shipping/classes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: shippingClass.id,
          ...shippingClass,
          is_active: !shippingClass.is_active,
        }),
      })

      if (!response.ok) throw new Error("Erro ao atualizar classe")

      const data = await response.json()
      if (data.success) {
        setClasses((prev) =>
          prev.map((c) => (c.id === shippingClass.id ? { ...c, is_active: !shippingClass.is_active } : c))
        )
        toast({
          title: "Classe atualizada",
          description: `${shippingClass.name} foi ${!shippingClass.is_active ? "ativada" : "desativada"}`,
        })
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao atualizar classe",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (shippingClass: ShippingClass) => {
    if (!confirm(`Tem a certeza que deseja eliminar a classe "${shippingClass.name}"? Esta ação é irreversível.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/shipping/classes?id=${shippingClass.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao eliminar classe")

      const data = await response.json()
      if (data.success) {
        setClasses((prev) => prev.filter((c) => c.id !== shippingClass.id))
        toast({
          title: "Classe eliminada",
          description: `${shippingClass.name} foi eliminada com sucesso`,
        })
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao eliminar classe",
        variant: "destructive",
      })
    }
  }

  const handleSave = async (classData: Partial<ShippingClass>) => {
    try {
      const isEditing = !!editingClass
      const response = await fetch("/api/admin/shipping/classes", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { id: editingClass.id, ...classData } : classData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao guardar classe")
      }

      toast({
        title: isEditing ? "Classe atualizada" : "Classe criada",
        description: `${classData.name} foi ${isEditing ? "atualizada" : "criada"} com sucesso`,
      })

      setIsModalOpen(false)
      setEditingClass(null)
      fetchClasses()
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao guardar classe",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive font-medium mb-4">{error}</p>
          <Button onClick={fetchClasses} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Classes de Envio
            </CardTitle>
            <CardDescription>
              Defina as classes de envio com base no peso máximo e transportadora
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchClasses} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button
              onClick={() => {
                setEditingClass(null)
                setIsModalOpen(true)
              }}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Classe
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Classe</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Peso Máximo</TableHead>
                <TableHead>Transportadora</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((shippingClass) => (
                <TableRow key={shippingClass.id}>
                  <TableCell className="font-medium">{shippingClass.name}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{shippingClass.code}</code>
                  </TableCell>
                  <TableCell>{formatWeight(shippingClass.max_weight_grams)}</TableCell>
                  <TableCell>{shippingClass.carrier_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={shippingClass.is_active}
                        onCheckedChange={() => handleToggleActive(shippingClass)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {shippingClass.is_active ? "Ativa" : "Inativa"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingClass(shippingClass)
                          setIsModalOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(shippingClass)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {classes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma classe de envio configurada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ClassEditModal
        shippingClass={editingClass}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSave}
      />
    </>
  )
}
