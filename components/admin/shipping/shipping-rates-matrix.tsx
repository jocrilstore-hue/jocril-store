"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Pencil, Trash2, RefreshCw, AlertCircle, Euro } from "lucide-react"
import type { ShippingZone, ShippingClass, ShippingRate } from "@/lib/types/shipping"
import { formatShippingCost, formatWeight, formatEstimatedDays } from "@/lib/types/shipping"
import { RateEditModal } from "./rate-edit-modal"

interface ShippingRateWithRelations extends ShippingRate {
  shipping_zones?: ShippingZone
  shipping_classes?: ShippingClass
}

export function ShippingRatesMatrix() {
  const [rates, setRates] = useState<ShippingRateWithRelations[]>([])
  const [zones, setZones] = useState<ShippingZone[]>([])
  const [classes, setClasses] = useState<ShippingClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedZone, setSelectedZone] = useState<string>("all")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [editingRate, setEditingRate] = useState<ShippingRateWithRelations | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [ratesRes, zonesRes, classesRes] = await Promise.all([
        fetch("/api/admin/shipping/rates"),
        fetch("/api/admin/shipping/zones"),
        fetch("/api/admin/shipping/classes"),
      ])

      if (!ratesRes.ok || !zonesRes.ok || !classesRes.ok) {
        throw new Error("Erro ao carregar dados")
      }

      const [ratesData, zonesData, classesData] = await Promise.all([
        ratesRes.json(),
        zonesRes.json(),
        classesRes.json(),
      ])

      if (ratesData.success) setRates(ratesData.data)
      if (zonesData.success) setZones(zonesData.data)
      if (classesData.success) setClasses(classesData.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleToggleActive = async (rate: ShippingRateWithRelations) => {
    try {
      const response = await fetch("/api/admin/shipping/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rate.id,
          zone_id: rate.zone_id,
          class_id: rate.class_id,
          min_weight_grams: rate.min_weight_grams,
          max_weight_grams: rate.max_weight_grams,
          base_rate_cents: rate.base_rate_cents,
          extra_kg_rate_cents: rate.extra_kg_rate_cents,
          estimated_days_min: rate.estimated_days_min,
          estimated_days_max: rate.estimated_days_max,
          is_active: !rate.is_active,
        }),
      })

      if (!response.ok) throw new Error("Erro ao atualizar taxa")

      const data = await response.json()
      if (data.success) {
        setRates((prev) =>
          prev.map((r) => (r.id === rate.id ? { ...r, is_active: !rate.is_active } : r))
        )
        toast({
          title: "Taxa atualizada",
          description: `Taxa foi ${!rate.is_active ? "ativada" : "desativada"}`,
        })
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao atualizar taxa",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (rate: ShippingRateWithRelations) => {
    if (!confirm("Tem a certeza que deseja eliminar esta taxa? Esta ação é irreversível.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/shipping/rates?id=${rate.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao eliminar taxa")

      const data = await response.json()
      if (data.success) {
        setRates((prev) => prev.filter((r) => r.id !== rate.id))
        toast({
          title: "Taxa eliminada",
          description: "Taxa foi eliminada com sucesso",
        })
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao eliminar taxa",
        variant: "destructive",
      })
    }
  }

  const handleSave = async (rateData: Partial<ShippingRate>) => {
    try {
      const isEditing = !!editingRate
      const response = await fetch("/api/admin/shipping/rates", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { id: editingRate.id, ...rateData } : rateData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro ao guardar taxa")
      }

      toast({
        title: isEditing ? "Taxa atualizada" : "Taxa criada",
        description: `Taxa foi ${isEditing ? "atualizada" : "criada"} com sucesso`,
      })

      setIsModalOpen(false)
      setEditingRate(null)
      fetchData()
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao guardar taxa",
        variant: "destructive",
      })
    }
  }

  const filteredRates = rates.filter((rate) => {
    if (selectedZone !== "all" && rate.zone_id !== parseInt(selectedZone)) return false
    if (selectedClass !== "all" && rate.class_id !== parseInt(selectedClass)) return false
    return true
  })

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
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
          <Button onClick={fetchData} variant="outline">
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
              <Euro className="h-5 w-5" />
              Taxas de Envio
            </CardTitle>
            <CardDescription>
              Configure as taxas de envio por zona, classe e intervalo de peso
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button
              onClick={() => {
                setEditingRate(null)
                setIsModalOpen(true)
              }}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Taxa
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="w-48">
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por zona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as zonas</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id.toString()}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zona</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Taxa Base</TableHead>
                <TableHead>Extra/kg</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>
                    <Badge variant="outline">{rate.shipping_zones?.name || "-"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{rate.shipping_classes?.name || "-"}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatWeight(rate.min_weight_grams)} - {formatWeight(rate.max_weight_grams)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatShippingCost(rate.base_rate_cents)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {rate.extra_kg_rate_cents > 0
                      ? `+${formatShippingCost(rate.extra_kg_rate_cents)}/kg`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatEstimatedDays(rate.estimated_days_min, rate.estimated_days_max)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rate.is_active}
                        onCheckedChange={() => handleToggleActive(rate)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingRate(rate)
                          setIsModalOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(rate)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma taxa de envio encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RateEditModal
        rate={editingRate}
        zones={zones}
        classes={classes}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSave}
      />
    </>
  )
}
