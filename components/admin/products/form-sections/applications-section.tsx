"use client";

import { UseFormReturn } from "react-hook-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ApplicationOption } from "@/lib/supabase/queries/admin-products";
import type { TemplateFormValues } from "@/hooks/use-product-template-form";

interface ApplicationsSectionProps {
    form: UseFormReturn<TemplateFormValues>;
    applications: ApplicationOption[];
}

export function ApplicationsSection({
    form,
    applications,
}: ApplicationsSectionProps) {
    const selectedApplications = form.watch("applications") || [];

    const toggleApplication = (applicationId: number) => {
        const current = selectedApplications;
        const updated = current.includes(applicationId)
            ? current.filter((id) => id !== applicationId)
            : [...current, applicationId];
        form.setValue("applications", updated);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Aplicações</CardTitle>
                <CardDescription>
                    Selecione onde este produto pode ser utilizado.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {applications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Não existem aplicações configuradas.
                    </p>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {applications.map((app) => (
                            <div
                                key={app.id}
                                className="flex items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                            >
                                <Checkbox
                                    id={`app-${app.id}`}
                                    checked={selectedApplications.includes(app.id)}
                                    onCheckedChange={() => toggleApplication(app.id)}
                                />
                                <Label
                                    htmlFor={`app-${app.id}`}
                                    className="cursor-pointer text-sm font-normal"
                                >
                                    {app.title}
                                </Label>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
