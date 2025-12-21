"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { ShippingZone } from "@/lib/types/shipping"
import { shippingZoneSchemaWithRefinement, type ShippingZoneFormData } from "@/lib/validations/shipping"

interface ZoneEditModalProps {
  zone: ShippingZone | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: ShippingZoneFormData) => void
}

export function ZoneEditModal({ zone, open, onOpenChange, onSave }: ZoneEditModalProps) {
  const isEditing = !!zone

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ShippingZoneFormData>({
    resolver: zodResolver(shippingZoneSchemaWithRefinement),
    defaultValues: {
      code: "",
      name: "",
      postal_code_start: 1000,
      postal_code_end: 9999,
      free_shipping_threshold_cents: null,
      is_active: true,
      display_order: 0,
    },
  })

  useEffect(() => {
    if (zone) {
      reset({
        code: zone.code,
        name: zone.name,
        postal_code_start: zone.postal_code_start,
        postal_code_end: zone.postal_code_end,
        free_shipping_threshold_cents: zone.free_shipping_threshold_cents,
        is_active: zone.is_active,
        display_order: zone.display_order,
      })
    } else {
      reset({
        code: "",
        name: "",
        postal_code_start: 1000,
        postal_code_end: 9999,
        free_shipping_threshold_cents: null,
        is_active: true,
        display_order: 0,
      })
    }
  }, [zone, reset])

  const onSubmit = (data: ShippingZoneFormData) => {
    onSave(data)
  }

  const isActive = watch("is_active")
  const freeShippingThreshold = watch("free_shipping_threshold_cents")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Zona" : "Nova Zona"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os detalhes da zona de envio"
              : "Crie uma nova zona de envio com base nos códigos postais"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Portugal Continental"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                placeholder="continental"
                {...register("code")}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postal_code_start">Código Postal Inicial</Label>
              <Input
                id="postal_code_start"
                type="number"
                min="1000"
                max="9999"
                {...register("postal_code_start", { valueAsNumber: true })}
              />
              {errors.postal_code_start && (
                <p className="text-sm text-destructive">{errors.postal_code_start.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code_end">Código Postal Final</Label>
              <Input
                id="postal_code_end"
                type="number"
                min="1000"
                max="9999"
                {...register("postal_code_end", { valueAsNumber: true })}
              />
              {errors.postal_code_end && (
                <p className="text-sm text-destructive">{errors.postal_code_end.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="free_shipping_threshold">Envio Grátis a partir de (cêntimos)</Label>
            <Input
              id="free_shipping_threshold"
              type="number"
              min="0"
              placeholder="50000 (para €500)"
              {...register("free_shipping_threshold_cents", {
                setValueAs: (v) => (v === "" ? null : parseInt(v, 10)),
              })}
            />
            <p className="text-sm text-muted-foreground">
              {freeShippingThreshold
                ? `Envio grátis para encomendas acima de €${(freeShippingThreshold / 100).toFixed(2)}`
                : "Deixe vazio para não oferecer envio grátis nesta zona"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_order">Ordem de Exibição</Label>
            <Input
              id="display_order"
              type="number"
              min="0"
              {...register("display_order", { valueAsNumber: true })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Zona Ativa</Label>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "A guardar..." : isEditing ? "Guardar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
