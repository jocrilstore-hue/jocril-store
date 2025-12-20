"use client";

import { UseFormReturn, Controller } from "react-hook-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { TemplateFormValues } from "@/hooks/use-product-template-form";
import { SEO_TITLE_MAX_LENGTH, SEO_DESCRIPTION_MAX_LENGTH } from "@/lib/constants";

interface SEOSectionProps {
    form: UseFormReturn<TemplateFormValues>;
}

export function SEOSection({ form }: SEOSectionProps) {
    const seoTitle = form.watch("seoTitleTemplate") || "";
    const seoDescription = form.watch("seoDescriptionTemplate") || "";
    const productName = form.watch("name") || "";

    // Generate preview from template
    const previewTitle = seoTitle
        ? seoTitle.replace("{name}", productName).replace("{size}", "[tamanho]")
        : productName || "Título do produto";

    const previewDescription = seoDescription
        ? seoDescription.replace("{name}", productName).replace("{size}", "[tamanho]")
        : "Descrição do produto...";

    return (
        <Card>
            <CardHeader>
                <CardTitle>SEO e Metadados</CardTitle>
                <CardDescription>
                    Configure como o produto aparece nos resultados de pesquisa. Use{" "}
                    <code className="text-xs bg-muted px-1 rounded">{"{name}"}</code> e{" "}
                    <code className="text-xs bg-muted px-1 rounded">{"{size}"}</code> como placeholders.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* SEO Title */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="seoTitleTemplate">Título SEO (template)</Label>
                        <Badge
                            variant={seoTitle.length > SEO_TITLE_MAX_LENGTH ? "destructive" : "secondary"}
                        >
                            {seoTitle.length}/{SEO_TITLE_MAX_LENGTH}
                        </Badge>
                    </div>
                    <Input
                        id="seoTitleTemplate"
                        {...form.register("seoTitleTemplate")}
                        placeholder="{name} - {size} | Jocril Acrílicos"
                    />
                    {form.formState.errors.seoTitleTemplate && (
                        <p className="text-xs text-destructive">
                            {form.formState.errors.seoTitleTemplate.message}
                        </p>
                    )}
                </div>

                {/* SEO Description */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="seoDescriptionTemplate">Meta description (template)</Label>
                        <Badge
                            variant={seoDescription.length > SEO_DESCRIPTION_MAX_LENGTH ? "destructive" : "secondary"}
                        >
                            {seoDescription.length}/{SEO_DESCRIPTION_MAX_LENGTH}
                        </Badge>
                    </div>
                    <Textarea
                        id="seoDescriptionTemplate"
                        {...form.register("seoDescriptionTemplate")}
                        rows={3}
                        placeholder="Compre {name} no tamanho {size}. Fabricado em Portugal com materiais de alta qualidade..."
                    />
                    {form.formState.errors.seoDescriptionTemplate && (
                        <p className="text-xs text-destructive">
                            {form.formState.errors.seoDescriptionTemplate.message}
                        </p>
                    )}
                </div>

                {/* Preview Card */}
                <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
                        Pré-visualização Google
                    </p>
                    <div className="space-y-1">
                        <p
                            className="text-blue-600 text-lg font-medium truncate"
                            title={previewTitle}
                        >
                            {previewTitle}
                        </p>
                        <p className="text-green-700 text-sm">
                            jocril.pt/produtos/exemplo-produto
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {previewDescription}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
