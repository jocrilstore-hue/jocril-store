"use client";

import { UseFormReturn } from "react-hook-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ProductTaxonomyData } from "@/lib/supabase/queries/admin-products";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { TemplateFormValues } from "@/hooks/use-product-template-form";

interface BasicInfoSectionProps {
    form: UseFormReturn<TemplateFormValues>;
    taxonomies: ProductTaxonomyData;
    slugValidation: {
        checking: boolean;
        unique: boolean;
        suggestion?: string;
    };
    checkSlugUniqueness: (slug: string) => Promise<void>;
    handleGenerateSlug: () => Promise<void>;
}

export function BasicInfoSection({
    form,
    taxonomies,
    slugValidation,
    checkSlugUniqueness,
    handleGenerateSlug,
}: BasicInfoSectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Informações gerais</CardTitle>
                <CardDescription>
                    Defina os dados principais do produto.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 md:items-start">
                {/* Name */}
                <div className="space-y-2">
                    <div className="flex h-8 items-center">
                        <Label htmlFor="name">Nome</Label>
                    </div>
                    <Input id="name" {...form.register("name")} />
                    {form.formState.errors.name && (
                        <p className="text-xs text-destructive">
                            {form.formState.errors.name.message}
                        </p>
                    )}
                </div>

                {/* Slug */}
                <div className="space-y-2">
                    <div className="flex h-8 items-center justify-between">
                        <Label htmlFor="slug">Slug</Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={handleGenerateSlug}
                        >
                            Gerar automaticamente
                        </Button>
                    </div>
                    <div className="relative">
                        <Input
                            id="slug"
                            {...form.register("slug")}
                            onChange={(e) => {
                                form.setValue("slug", e.target.value);
                                checkSlugUniqueness(e.target.value);
                            }}
                            className={cn(
                                !slugValidation.unique &&
                                "border-destructive focus-visible:ring-destructive",
                                slugValidation.unique &&
                                form.watch("slug") &&
                                "border-green-500 focus-visible:ring-green-500",
                            )}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {slugValidation.checking && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            {!slugValidation.checking &&
                                slugValidation.unique &&
                                form.watch("slug") && (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                )}
                            {!slugValidation.checking && !slugValidation.unique && (
                                <XCircle className="h-4 w-4 text-destructive" />
                            )}
                        </div>
                    </div>
                    {form.formState.errors.slug && (
                        <p className="text-xs text-destructive">
                            {form.formState.errors.slug.message}
                        </p>
                    )}
                    {!slugValidation.unique && slugValidation.suggestion && (
                        <div className="mt-1 flex items-center gap-2">
                            <AlertCircle className="h-3 w-3 text-amber-600" />
                            <p className="text-xs text-muted-foreground">
                                Sugestão:{" "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        form.setValue("slug", slugValidation.suggestion!);
                                        checkSlugUniqueness(slugValidation.suggestion!);
                                    }}
                                    className="font-medium text-primary hover:underline"
                                >
                                    {slugValidation.suggestion}
                                </button>
                            </p>
                        </div>
                    )}
                </div>

                {/* Reference Code */}
                <div className="space-y-2">
                    <Label htmlFor="referenceCode">Código de referência</Label>
                    <Input id="referenceCode" {...form.register("referenceCode")} />
                </div>

                {/* SKU Prefix */}
                <div className="space-y-2">
                    <Label htmlFor="skuPrefix">Prefixo SKU</Label>
                    <Input id="skuPrefix" {...form.register("skuPrefix")} />
                </div>

                {/* Category */}
                <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                        value={String(form.watch("categoryId"))}
                        onValueChange={(value) =>
                            form.setValue("categoryId", Number(value))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            {taxonomies.categories.map((category) => (
                                <SelectItem key={category.id} value={String(category.id)}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Material */}
                <div className="space-y-2">
                    <Label>Material</Label>
                    <Select
                        value={
                            form.watch("materialId")
                                ? String(form.watch("materialId"))
                                : "none"
                        }
                        onValueChange={(value) =>
                            form.setValue("materialId", value === "none" ? null : Number(value))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sem material</SelectItem>
                            {taxonomies.materials.map((material) => (
                                <SelectItem key={material.id} value={String(material.id)}>
                                    {material.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Orientation */}
                <div className="space-y-2">
                    <Label>Orientação</Label>
                    <Select
                        value={form.watch("orientation")}
                        onValueChange={(value: TemplateFormValues["orientation"]) =>
                            form.setValue("orientation", value)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="vertical">Vertical</SelectItem>
                            <SelectItem value="horizontal">Horizontal</SelectItem>
                            <SelectItem value="both">Ambas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Min Order Quantity */}
                <div className="space-y-2">
                    <Label htmlFor="minOrderQuantity">Quantidade mínima</Label>
                    <Input
                        id="minOrderQuantity"
                        type="number"
                        min={1}
                        {...form.register("minOrderQuantity", { valueAsNumber: true })}
                    />
                </div>

                {/* Boolean Switches Grid */}
                <div className="col-span-full grid gap-3 rounded-lg border p-4 md:grid-cols-3">
                    <SwitchField
                        form={form}
                        name="isActive"
                        label="Ativo"
                        description="Disponível no site público"
                    />
                    <SwitchField
                        form={form}
                        name="isFeatured"
                        label="Destaque"
                        description="Mostrado nas listagens principais"
                    />
                    <SwitchField
                        form={form}
                        name="isCustomizable"
                        label="Personalizável"
                        description="Aceita medidas especiais"
                    />
                    <SwitchField
                        form={form}
                        name="isDoubleSided"
                        label="Dupla face"
                        description="Permite impressão dos dois lados"
                    />
                    <SwitchField
                        form={form}
                        name="isAdhesive"
                        label="Adesivo"
                        description="Inclui fita/painel adesivo"
                    />
                    <SwitchField
                        form={form}
                        name="hasLock"
                        label="Tem fecho"
                        description="Inclui fechadura ou mecanismo"
                    />
                    <SwitchField
                        form={form}
                        name="hasQuantityDiscounts"
                        label="Descontos por quantidade"
                        description="Exibe tabela de preços progressivos"
                    />
                </div>
            </CardContent>
        </Card>
    );
}

// Extracted switch field component for reuse
interface SwitchFieldProps {
    form: UseFormReturn<TemplateFormValues>;
    name: keyof Pick<
        TemplateFormValues,
        | "isActive"
        | "isFeatured"
        | "isCustomizable"
        | "isDoubleSided"
        | "isAdhesive"
        | "hasLock"
        | "hasQuantityDiscounts"
    >;
    label: string;
    description: string;
}

function SwitchField({ form, name, label, description }: SwitchFieldProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Switch
                checked={form.watch(name)}
                onCheckedChange={(checked) => form.setValue(name, checked)}
            />
        </div>
    );
}
