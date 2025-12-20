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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import type { TemplateFormValues } from "@/hooks/use-product-template-form";

interface SettingsSectionProps {
    form: UseFormReturn<TemplateFormValues>;
    mode: "create" | "edit";
    templateId?: number;
    onDelete?: () => Promise<void>;
}

export function SettingsSection({
    form,
    mode,
    templateId,
    onDelete,
}: SettingsSectionProps) {
    return (
        <div className="space-y-6">
            {/* Display Order */}
            <Card>
                <CardHeader>
                    <CardTitle>Ordenação</CardTitle>
                    <CardDescription>
                        Defina a ordem de exibição nas listagens.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="max-w-xs space-y-2">
                        <Label htmlFor="displayOrder">Ordem de exibição</Label>
                        <Input
                            id="displayOrder"
                            type="number"
                            min={0}
                            {...form.register("displayOrder", { valueAsNumber: true })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Números menores aparecem primeiro. Deixe 0 para ordenação automática.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            {mode === "edit" && templateId && (
                <Card className="border-destructive/50">
                    <CardHeader>
                        <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                        <CardDescription>
                            Ações irreversíveis. Tenha cuidado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={onDelete}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Eliminar produto
                        </Button>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Esta ação irá eliminar permanentemente o produto e todas as suas
                            variantes associadas.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
