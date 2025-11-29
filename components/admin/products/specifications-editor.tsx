"use client";

import { useFieldArray, useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface SpecificationsEditorProps {
  name: string;
}

const FORMATOS = ["A6", "A5", "A4", "A3", "A2", "A1", "A0", "Personalizado"];
const IMPRESSAO_OPTIONS = [
  { value: "frente", label: "Só frente" },
  { value: "verso", label: "Só verso" },
  { value: "frente_verso", label: "Frente e verso" },
];

export function SpecificationsEditor({ name }: SpecificationsEditorProps) {
  const { control, register, watch, setValue } = useFormContext();

  const extrasArray = useFieldArray({
    control,
    name: `${name}.extras`,
  });

  return (
    <div className="space-y-8">
      {/* PRODUTO Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium uppercase tracking-wide text-foreground border-b border-dashed border-[var(--color-base-500)] pb-2">
          Produto
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${name}.produto.largura_mm`}>Largura (mm)</Label>
            <Input
              id={`${name}.produto.largura_mm`}
              type="number"
              placeholder="119"
              {...register(`${name}.produto.largura_mm`, {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${name}.produto.altura_mm`}>Altura (mm)</Label>
            <Input
              id={`${name}.produto.altura_mm`}
              type="number"
              placeholder="132"
              {...register(`${name}.produto.altura_mm`, {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${name}.produto.profundidade_mm`}>
              Profundidade (mm)
            </Label>
            <Input
              id={`${name}.produto.profundidade_mm`}
              type="number"
              placeholder="40"
              {...register(`${name}.produto.profundidade_mm`, {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
            />
          </div>
        </div>
      </div>

      {/* ÁREA GRÁFICA Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium uppercase tracking-wide text-foreground border-b border-dashed border-[var(--color-base-500)] pb-2">
          Área Gráfica
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${name}.area_grafica.largura_mm`}>
              Largura (mm)
            </Label>
            <Input
              id={`${name}.area_grafica.largura_mm`}
              type="number"
              placeholder="105"
              {...register(`${name}.area_grafica.largura_mm`, {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${name}.area_grafica.altura_mm`}>
              Altura (mm)
            </Label>
            <Input
              id={`${name}.area_grafica.altura_mm`}
              type="number"
              placeholder="148"
              {...register(`${name}.area_grafica.altura_mm`, {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
            />
          </div>
          <div className="space-y-2">
            <Label>Formato</Label>
            <Controller
              name={`${name}.area_grafica.formato`}
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? "__none__"}
                  onValueChange={(v) =>
                    field.onChange(v === "__none__" ? null : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {FORMATOS.map((formato) => (
                      <SelectItem key={formato} value={formato}>
                        {formato}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Impressão</Label>
            <Controller
              name={`${name}.area_grafica.impressao`}
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? "__none__"}
                  onValueChange={(v) =>
                    field.onChange(v === "__none__" ? null : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Não aplicável</SelectItem>
                    {IMPRESSAO_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${name}.area_grafica.num_cores`}>
              Nº de cores
            </Label>
            <Input
              id={`${name}.area_grafica.num_cores`}
              type="number"
              placeholder="4"
              {...register(`${name}.area_grafica.num_cores`, {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
            />
          </div>
        </div>
      </div>

      {/* NOTAS Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium uppercase tracking-wide text-foreground border-b border-dashed border-[var(--color-base-500)] pb-2">
          Notas
        </h4>
        <Textarea
          placeholder="Informações adicionais sobre o produto..."
          rows={3}
          {...register(`${name}.notas`)}
        />
      </div>

      {/* EXTRAS Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium uppercase tracking-wide text-foreground border-b border-dashed border-[var(--color-base-500)] pb-2">
          Características Adicionais
        </h4>
        <div className="space-y-3">
          {extrasArray.fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-3">
              <div className="flex-1 grid grid-cols-2 gap-3">
                <Input
                  placeholder="Label (ex: Peso)"
                  {...register(`${name}.extras.${index}.label`)}
                />
                <Input
                  placeholder="Valor (ex: 250g)"
                  {...register(`${name}.extras.${index}.value`)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => extrasArray.remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => extrasArray.append({ label: "", value: "" })}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar característica
          </Button>
        </div>
      </div>
    </div>
  );
}
