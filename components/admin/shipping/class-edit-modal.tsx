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
import type { ShippingClass } from "@/lib/types/shipping"
import { shippingClassSchema, type ShippingClassFormData } from "@/lib/validations/shipping"

interface ClassEditModalProps {
  shippingClass: ShippingClass | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: ShippingClassFormData) => void
}

export function ClassEditModal({ shippingClass, open, onOpenChange, onSave }: ClassEditModalProps) {
  const isEditing = !!shippingClass

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ShippingClassFormData>({
    resolver: zodResolver(shippingClassSchema),
    defaultValues: {
      code: "",
      name: "",
      max_weight_grams: 30000,
      carrier_name: "",
      is_active: true,
    },
  })

  useEffect(() => {
    if (shippingClass) {
      reset({
        code: shippingClass.code,
        name: shippingClass.name,
        max_weight_grams: shippingClass.max_weight_grams,
        carrier_name: shippingClass.carrier_name,
        is_active: shippingClass.is_active,
      })
    } else {
      reset({
        code: "",
        name: "",
        max_weight_grams: 30000,
        carrier_name: "",
        is_active: true,
      })
    }
  }, [shippingClass, reset])

  const onSubmit = (data: ShippingClassFormData) => {
    onSave(data)
  }

  const isActive = watch("is_active")
  const maxWeight = watch("max_weight_grams")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Classe" : "Nova Classe"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os detalhes da classe de envio"
              : "Crie uma nova classe de envio com base no peso máximo"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Envio Standard"
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
                placeholder="standard"
                {...register("code")}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_weight_grams">Peso Máximo (gramas)</Label>
            <Input
              id="max_weight_grams"
              type="number"
              min="1"
              {...register("max_weight_grams", { valueAsNumber: true })}
            />
            <p className="text-sm text-muted-foreground">
              {maxWeight >= 1000
                ? `${(maxWeight / 1000).toFixed(1)} kg`
                : `${maxWeight} g`}
            </p>
            {errors.max_weight_grams && (
              <p className="text-sm text-destructive">{errors.max_weight_grams.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="carrier_name">Transportadora(s)</Label>
            <Input
              id="carrier_name"
              placeholder="CTT Expresso, DPD"
              {...register("carrier_name")}
            />
            {errors.carrier_name && (
              <p className="text-sm text-destructive">{errors.carrier_name.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Classe Ativa</Label>
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
