"use client";

import { UseFormReturn, Controller, useFieldArray } from "react-hook-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SpecificationsEditor } from "@/components/admin/products/specifications-editor";
import { Plus, Trash2 } from "lucide-react";
import type { TemplateFormValues } from "@/hooks/use-product-template-form";

interface ContentSectionProps {
    form: UseFormReturn<TemplateFormValues>;
    faqFieldArray: ReturnType<typeof useFieldArray<TemplateFormValues, "faq">>;
}

export function ContentSection({ form, faqFieldArray }: ContentSectionProps) {
    const { fields, append, remove } = faqFieldArray;

    return (
        <div className="space-y-6">
            {/* Descriptions Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Descrições</CardTitle>
                    <CardDescription>
                        Conteúdo exibido nas páginas públicas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="shortDescription">Resumo</Label>
                        <Textarea
                            id="shortDescription"
                            rows={3}
                            {...form.register("shortDescription")}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Descrição completa</Label>
                        <Controller
                            name="fullDescription"
                            control={form.control}
                            render={({ field }) => (
                                <RichTextEditor
                                    value={field.value ?? ""}
                                    onChange={field.onChange}
                                    placeholder="Detalhes completos..."
                                />
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Vantagens</Label>
                        <Controller
                            name="advantages"
                            control={form.control}
                            render={({ field }) => (
                                <RichTextEditor
                                    value={field.value ?? ""}
                                    onChange={field.onChange}
                                    placeholder="Porquê escolher este produto..."
                                />
                            )}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="careInstructions">Instruções de manutenção</Label>
                        <Textarea
                            id="careInstructions"
                            rows={3}
                            {...form.register("careInstructions")}
                            placeholder="Como limpar e manter o produto..."
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Specifications Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Especificações Técnicas</CardTitle>
                    <CardDescription>
                        Dimensões e características do produto.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SpecificationsEditor name="specificationsJson" />
                </CardContent>
            </Card>

            {/* FAQ Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Perguntas Frequentes</CardTitle>
                    <CardDescription>
                        Perguntas e respostas sobre o produto.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="space-y-2 rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <Label>Pergunta {index + 1}</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <Input
                                {...form.register(`faq.${index}.question`)}
                                placeholder="Pergunta..."
                            />
                            <Textarea
                                {...form.register(`faq.${index}.answer`)}
                                rows={2}
                                placeholder="Resposta..."
                            />
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ question: "", answer: "" })}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Adicionar pergunta
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
