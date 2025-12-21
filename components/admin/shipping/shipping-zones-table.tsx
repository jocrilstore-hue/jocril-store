"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Plus, Pencil, Trash2, RefreshCw, AlertCircle, MapPin } from "lucide-react"
import type { ShippingZone } from "@/lib/types/shipping"
import { formatShippingCost } from "@/lib/types/shipping"
import { ZoneEditModal } from "./zone-edit-modal"

export function ShippingZonesTable() {
  const [zones, setZones] = useState<ShippingZone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  const fetchZones = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/shipping/zones")
      if (!response.ok) throw new Error("Erro ao carregar zonas")
      const data = await response.json()
      if (data.success) {
        setZones(data.data)
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
    fetchZones()
  }, [])

  const handleToggleActive = async (zone: ShippingZone) => {
    try {
      const response = await fetch("/api/admin/shipping/zones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: zone.id,
          ...zone,
          is_active: !zone.is_active,
        }),
      })

      if (!response.ok) throw new Error("Erro ao atualizar zona")

      const data = await response.json()
      if (data.success) {
        setZones((prev) =>
          prev.map((z) => (z.id === zone.id ? { ...z, is_active: !zone.is_active } : z))
        )
        toast({
          title: "Zona atualizada",
          description: `${zone.name} foi ${!zone.is_active ? "ativada" : "desativada"}`,
        })
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao atualizar zona",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (zone: ShippingZone) => {
    if (!confirm(`Tem a certeza que deseja eliminar a zona "${zone.name}"? Esta ação é irreversível.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/shipping/zones?id=${zone.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao eliminar zona")

      const data = await response.json()
      if (data.success) {
        setZones((prev) => prev.filter((z) => z.id !== zone.id))
        toast({
          title: "Zona eliminada",
          description: `${zone.name} foi eliminada com sucesso`,
        })
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao eliminar zona",
        variant: "destructive",
      })
    }
  }

  const handleSave = async (zoneData: Partial<ShippingZone>) => {
    try {
      const isEditing = !!editingZone
      const response = await fetch("/api/admin/shipping/zones", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { id: editingZone.id, ...zoneData } : zoneData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao guardar zona")
      }

      toast({
        title: isEditing ? "Zona atualizada" : "Zona criada",
        description: `${zoneData.name} foi ${isEditing ? "atualizada" : "criada"} com sucesso`,
      })

      setIsModalOpen(false)
      setEditingZone(null)
      fetchZones()
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao guardar zona",
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
            {[1, 2, 3].map((i) => (
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
          <Button onClick={fetchZones} variant="outline">
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
              <MapPin className="h-5 w-5" />
              Zonas de Envio
            </CardTitle>
            <CardDescription>
              Defina as zonas geográficas de envio com base nos códigos postais
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchZones} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button
              onClick={() => {
                setEditingZone(null)
                setIsModalOpen(true)
              }}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Zona
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zona</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Códigos Postais</TableHead>
                <TableHead>Envio Grátis</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">{zone.name}</TableCell>
                  <TableCell>
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{zone.code}</code>
                  </TableCell>
                  <TableCell>
                    {zone.postal_code_start} - {zone.postal_code_end}
                  </TableCell>
                  <TableCell>
                    {zone.free_shipping_threshold_cents ? (
                      <Badge variant="secondary">
                        A partir de {formatShippingCost(zone.free_shipping_threshold_cents)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={zone.is_active}
                        onCheckedChange={() => handleToggleActive(zone)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {zone.is_active ? "Ativa" : "Inativa"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingZone(zone)
                          setIsModalOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(zone)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {zones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma zona de envio configurada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ZoneEditModal
        zone={editingZone}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSave}
      />
    </>
  )
}
