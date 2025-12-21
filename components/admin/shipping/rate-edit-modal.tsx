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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ShippingZone, ShippingClass, ShippingRate } from "@/lib/types/shipping"
import { shippingRateSchemaWithRefinement, type ShippingRateFormData } from "@/lib/validations/shipping"

interface RateEditModalProps {
  rate: ShippingRate | null
  zones: ShippingZone[]
  classes: ShippingClass[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: ShippingRateFormData) => void
}

export function RateEditModal({
  rate,
  zones,
  classes,
  open,
  onOpenChange,
  onSave,
}: RateEditModalProps) {
  const isEditing = !!rate

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ShippingRateFormData>({
    resolver: zodResolver(shippingRateSchemaWithRefinement),
    defaultValues: {
      zone_id: zones[0]?.id || 0,
      class_id: classes[0]?.id || 0,
      min_weight_grams: 0,
      max_weight_grams: 5000,
      base_rate_cents: 500,
      extra_kg_rate_cents: 0,
      estimated_days_min: 1,
      estimated_days_max: 3,
      is_active: true,
    },
  })

  useEffect(() => {
    if (rate) {
      reset({
        zone_id: rate.zone_id,
        class_id: rate.class_id,
        min_weight_grams: rate.min_weight_grams,
        max_weight_grams: rate.max_weight_grams,
        base_rate_cents: rate.base_rate_cents,
        extra_kg_rate_cents: rate.extra_kg_rate_cents,
        estimated_days_min: rate.estimated_days_min,
        estimated_days_max: rate.estimated_days_max,
        is_active: rate.is_active,
      })
    } else {
      reset({
        zone_id: zones[0]?.id || 0,
        class_id: classes[0]?.id || 0,
        min_weight_grams: 0,
        max_weight_grams: 5000,
        base_rate_cents: 500,
        extra_kg_rate_cents: 0,
        estimated_days_min: 1,
        estimated_days_max: 3,
        is_active: true,
      })
    }
  }, [rate, zones, classes, reset])

  const onSubmit = (data: ShippingRateFormData) => {
    onSave(data)
  }

  const isActive = watch("is_active")
  const zoneId = watch("zone_id")
  const classId = watch("class_id")
  const baseRate = watch("base_rate_cents")
  const extraRate = watch("extra_kg_rate_cents")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Taxa" : "Nova Taxa"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os detalhes da taxa de envio"
              : "Crie uma nova taxa de envio para uma combinação de zona, classe e peso"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Zona</Label>
              <Select
                value={zoneId?.toString()}
                onValueChange={(value) => setValue("zone_id", parseInt(value, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma zona" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id.toString()}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.zone_id && (
                <p className="text-sm text-destructive">{errors.zone_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Classe</Label>
              <Select
                value={classId?.toString()}
                onValueChange={(value) => setValue("class_id", parseInt(value, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma classe" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.class_id && (
                <p className="text-sm text-destructive">{errors.class_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min_weight_grams">Peso Mínimo (gramas)</Label>
              <Input
                id="min_weight_grams"
                type="number"
                min="0"
                {...register("min_weight_grams", { valueAsNumber: true })}
              />
              {errors.min_weight_grams && (
                <p className="text-sm text-destructive">{errors.min_weight_grams.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_weight_grams">Peso Máximo (gramas)</Label>
              <Input
                id="max_weight_grams"
                type="number"
                min="1"
                {...register("max_weight_grams", { valueAsNumber: true })}
              />
              {errors.max_weight_grams && (
                <p className="text-sm text-destructive">{errors.max_weight_grams.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="base_rate_cents">Taxa Base (cêntimos)</Label>
              <Input
                id="base_rate_cents"
                type="number"
                min="0"
                {...register("base_rate_cents", { valueAsNumber: true })}
              />
              <p className="text-sm text-muted-foreground">
                €{(baseRate / 100).toFixed(2)}
              </p>
              {errors.base_rate_cents && (
                <p className="text-sm text-destructive">{errors.base_rate_cents.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="extra_kg_rate_cents">Taxa Extra por kg (cêntimos)</Label>
              <Input
                id="extra_kg_rate_cents"
                type="number"
                min="0"
                {...register("extra_kg_rate_cents", { valueAsNumber: true })}
              />
              <p className="text-sm text-muted-foreground">
                {extraRate > 0 ? `+€${(extraRate / 100).toFixed(2)}/kg` : "Sem taxa extra"}
              </p>
              {errors.extra_kg_rate_cents && (
                <p className="text-sm text-destructive">{errors.extra_kg_rate_cents.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="estimated_days_min">Dias Mínimos de Entrega</Label>
              <Input
                id="estimated_days_min"
                type="number"
                min="1"
                {...register("estimated_days_min", { valueAsNumber: true })}
              />
              {errors.estimated_days_min && (
                <p className="text-sm text-destructive">{errors.estimated_days_min.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_days_max">Dias Máximos de Entrega</Label>
              <Input
                id="estimated_days_max"
                type="number"
                min="1"
                {...register("estimated_days_max", { valueAsNumber: true })}
              />
              {errors.estimated_days_max && (
                <p className="text-sm text-destructive">{errors.estimated_days_max.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Taxa Ativa</Label>
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
