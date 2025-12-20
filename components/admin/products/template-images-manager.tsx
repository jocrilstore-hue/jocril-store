"use client";

import { useCallback, useState, useRef } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  uploadImageWithCompression,
  deleteImage,
} from "@/lib/utils/image-upload";
import type { ProductTemplateImage } from "@/lib/types";
import {
  ImagePlus,
  Trash2,
  Loader2,
  Star,
  FileImage,
  Images,
} from "lucide-react";

interface TemplateImagesManagerProps {
  templateId: number;
  images: ProductTemplateImage[];
  onImagesChange: (images: ProductTemplateImage[]) => void;
}

export function TemplateImagesManager({
  templateId,
  images,
  onImagesChange,
}: TemplateImagesManagerProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<number, boolean>>({});
  const supabase = createClient();

  // Refs for file inputs
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const technicalImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const mainImage = images.find((img) => img.image_type === "main");
  const technicalImage = images.find((img) => img.image_type === "technical");
  const galleryImages = images.filter((img) => img.image_type === "gallery");

  const handleUpload = useCallback(
    async (
      e: React.ChangeEvent<HTMLInputElement>,
      imageType: "main" | "technical" | "gallery",
    ) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploading((prev) => ({ ...prev, [imageType]: true }));

      try {
        const filesToUpload =
          imageType === "gallery" ? Array.from(files) : [files[0]];

        for (const file of filesToUpload) {
          // Upload to storage
          const result = await uploadImageWithCompression(file, {
            folder: `templates/${templateId}`,
            compress: true,
            maxWidth: 1920,
            quality: 0.9,
          });

          if (!result.success || !result.url) {
            toast({
              title: "Erro no upload",
              description:
                result.error || "Não foi possível fazer upload da imagem",
              variant: "destructive",
            });
            continue;
          }

          // For main/technical, we need to replace existing (due to unique constraint)
          if (imageType === "main" || imageType === "technical") {
            const existingImage =
              imageType === "main" ? mainImage : technicalImage;

            if (existingImage) {
              // Delete old image from storage
              const oldPath = existingImage.image_url
                .split("/")
                .slice(-2)
                .join("/");
              await deleteImage(oldPath);

              // Update in database
              const { error } = await supabase
                .from("product_template_images")
                .update({
                  image_url: result.url,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingImage.id);

              if (error) throw error;

              // Update local state
              onImagesChange(
                images.map((img) =>
                  img.id === existingImage.id
                    ? { ...img, image_url: result.url! }
                    : img,
                ),
              );
            } else {
              // Insert new image
              const { data, error } = await supabase
                .from("product_template_images")
                .insert({
                  product_template_id: templateId,
                  image_url: result.url,
                  image_type: imageType,
                  display_order: 0,
                })
                .select()
                .single();

              if (error) throw error;

              onImagesChange([
                ...images,
                {
                  id: data.id,
                  product_template_id: templateId,
                  image_url: result.url,
                  image_type: imageType,
                  display_order: 0,
                },
              ]);
            }
          } else {
            // Gallery - just add new image
            const maxOrder = Math.max(
              0,
              ...galleryImages.map((img) => img.display_order),
            );

            const { data, error } = await supabase
              .from("product_template_images")
              .insert({
                product_template_id: templateId,
                image_url: result.url,
                image_type: "gallery",
                display_order: maxOrder + 1,
              })
              .select()
              .single();

            if (error) throw error;

            onImagesChange([
              ...images,
              {
                id: data.id,
                product_template_id: templateId,
                image_url: result.url,
                image_type: "gallery",
                display_order: maxOrder + 1,
              },
            ]);
          }

          toast({
            title: "Imagem enviada",
            description: "A imagem foi enviada com sucesso",
          });
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao fazer upload da imagem",
          variant: "destructive",
        });
      } finally {
        setUploading((prev) => ({ ...prev, [imageType]: false }));
        // Reset input
        e.target.value = "";
      }
    },
    [
      templateId,
      images,
      mainImage,
      technicalImage,
      galleryImages,
      supabase,
      toast,
      onImagesChange,
    ],
  );

  const handleDelete = useCallback(
    async (image: ProductTemplateImage) => {
      if (!confirm("Tem certeza que deseja eliminar esta imagem?")) return;

      setDeleting((prev) => ({ ...prev, [image.id]: true }));

      try {
        // Delete from storage
        const path = image.image_url.split("/").slice(-2).join("/");
        await deleteImage(path);

        // Delete from database
        const { error } = await supabase
          .from("product_template_images")
          .delete()
          .eq("id", image.id);

        if (error) throw error;

        // Update local state
        onImagesChange(images.filter((img) => img.id !== image.id));

        toast({
          title: "Imagem eliminada",
          description: "A imagem foi eliminada com sucesso",
        });
      } catch (error) {
        console.error("Delete error:", error);
        toast({
          title: "Erro",
          description: "Não foi possível eliminar a imagem",
          variant: "destructive",
        });
      } finally {
        setDeleting((prev) => ({ ...prev, [image.id]: false }));
      }
    },
    [images, supabase, toast, onImagesChange],
  );

  return (
    <div className="space-y-6">
      {/* Main Image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Imagem Principal
          </CardTitle>
          <CardDescription>
            A imagem principal é exibida nas listagens e como destaque do
            produto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <div
              className="relative aspect-square w-48 overflow-hidden rounded-lg border bg-muted cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => mainImageInputRef.current?.click()}
              title={
                mainImage
                  ? "Clique para substituir a imagem"
                  : "Clique para adicionar uma imagem"
              }
            >
              {mainImage ? (
                <>
                  <Image
                    src={mainImage.image_url}
                    alt="Imagem principal"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(mainImage);
                    }}
                    disabled={deleting[mainImage.id]}
                  >
                    {deleting[mainImage.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImagePlus className="h-12 w-12 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="main-image">
                {mainImage ? "Substituir imagem" : "Adicionar imagem"}
              </Label>
              <Input
                ref={mainImageInputRef}
                id="main-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => handleUpload(e, "main")}
                disabled={uploading.main}
                className="cursor-pointer"
              />
              {uploading.main && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />A enviar...
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos: JPEG, PNG, WebP, AVIF. Máx: 5MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Drawing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5 text-blue-500" />
            Desenho Técnico
          </CardTitle>
          <CardDescription>
            Imagem com medidas e especificações técnicas do produto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <div
              className="relative aspect-square w-48 overflow-hidden rounded-lg border bg-muted cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => technicalImageInputRef.current?.click()}
              title={
                technicalImage
                  ? "Clique para substituir o desenho"
                  : "Clique para adicionar um desenho"
              }
            >
              {technicalImage ? (
                <>
                  <Image
                    src={technicalImage.image_url}
                    alt="Desenho técnico"
                    fill
                    className="object-contain bg-white"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(technicalImage);
                    }}
                    disabled={deleting[technicalImage.id]}
                  >
                    {deleting[technicalImage.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <FileImage className="h-12 w-12 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="technical-image">
                {technicalImage ? "Substituir desenho" : "Adicionar desenho"}
              </Label>
              <Input
                ref={technicalImageInputRef}
                id="technical-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => handleUpload(e, "technical")}
                disabled={uploading.technical}
                className="cursor-pointer"
              />
              {uploading.technical && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />A enviar...
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos: JPEG, PNG, WebP, AVIF. Máx: 5MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Images className="h-5 w-5 text-green-500" />
            Galeria de Imagens
          </CardTitle>
          <CardDescription>
            Imagens adicionais do produto (diferentes ângulos, detalhes, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File input button for gallery */}
          <div className="space-y-2">
            <Label htmlFor="gallery-images">Adicionar imagens à galeria</Label>
            <Input
              ref={galleryInputRef}
              id="gallery-images"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={(e) => handleUpload(e, "gallery")}
              disabled={uploading.gallery}
              className="cursor-pointer"
            />
            {uploading.gallery && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />A enviar...
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Pode selecionar várias imagens de uma vez. Formatos: JPEG, PNG,
              WebP, AVIF. Máx: 5MB cada.
            </p>
          </div>

          {/* Gallery grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {galleryImages.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
              >
                <Image
                  src={image.image_url}
                  alt={image.alt_text || "Imagem da galeria"}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(image)}
                    disabled={deleting[image.id]}
                  >
                    {deleting[image.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {/* Add new gallery image placeholder */}
            <label
              className={cn(
                "relative flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary hover:bg-muted/50",
                uploading.gallery && "pointer-events-none opacity-50",
              )}
              onClick={() => galleryInputRef.current?.click()}
              title="Clique para adicionar imagens"
            >
              {uploading.gallery ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-xs">Adicionar</span>
                </div>
              )}
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
