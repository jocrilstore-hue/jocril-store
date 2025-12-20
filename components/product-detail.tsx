"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Flag,
  Lock,
  Truck,
  UtensilsCrossed,
  Building2,
  Store,
  Briefcase,
} from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
import type { ProductSpecifications } from "@/lib/types";
import { MAX_CART_QUANTITY } from "@/lib/constants";

interface ProductDetailProps {
  currentVariant: any;
  allVariants: any[];
  priceTiersByVariant: Record<number, any[]>;
  images: any[];
  templateImages?: any[];
}

// Helper to render a single specs table
function SpecsTableSection({
  title,
  specs,
}: {
  title: string;
  specs: { label: string; value: string | number | null }[];
}) {
  const filteredSpecs = specs.filter(
    (s) => s.value !== null && s.value !== undefined && s.value !== "",
  );
  if (filteredSpecs.length === 0) return null;

  return (
    <div>
      <h4
        className="text-xs uppercase tracking-widest mb-4"
        style={{ color: "var(--accent-100)" }}
      >
        {title}
      </h4>
      <table className="w-full">
        <tbody>
          {filteredSpecs.map((spec, index) => (
            <tr
              key={index}
              className="border-b border-dashed border-[var(--color-base-500)]"
            >
              <td className="py-3 pr-4 text-sm text-muted-foreground w-1/2">
                {spec.label}
              </td>
              <td className="py-3 text-sm text-foreground font-medium">
                {typeof spec.value === "number"
                  ? `${spec.value}mm`
                  : spec.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Component to display structured specifications
function StructuredSpecifications({ specs }: { specs: ProductSpecifications }) {
  const impressaoLabels: Record<string, string> = {
    frente: "Só frente",
    verso: "Só verso",
    frente_verso: "Frente e verso",
  };

  const produtoSpecs = [
    { label: "Largura", value: specs.produto?.largura_mm },
    { label: "Altura", value: specs.produto?.altura_mm },
    { label: "Profundidade", value: specs.produto?.profundidade_mm },
  ];

  const areaGraficaSpecs = [
    { label: "Largura", value: specs.area_grafica?.largura_mm ?? null },
    { label: "Altura", value: specs.area_grafica?.altura_mm ?? null },
    {
      label: "Formato",
      value: specs.area_grafica?.formato ?? null,
    },
    {
      label: "Impressão",
      value: specs.area_grafica?.impressao
        ? (impressaoLabels[specs.area_grafica.impressao] ?? null)
        : null,
    },
    {
      label: "Nº de cores",
      value: specs.area_grafica?.num_cores
        ? String(specs.area_grafica.num_cores)
        : null,
    },
  ];

  const extraSpecs =
    specs.extras?.map((e) => ({ label: e.label, value: e.value })) || [];

  return (
    <div className="space-y-8">
      <SpecsTableSection title="Produto" specs={produtoSpecs} />
      <SpecsTableSection title="Área Gráfica" specs={areaGraficaSpecs} />
      {extraSpecs.length > 0 && (
        <SpecsTableSection title="Outras Características" specs={extraSpecs} />
      )}
      {specs.notas && (
        <div>
          <h4
            className="text-xs uppercase tracking-widest mb-3"
            style={{ color: "var(--accent-100)" }}
          >
            Notas
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {specs.notas}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ProductDetail({
  currentVariant,
  allVariants,
  priceTiersByVariant,
  images: _images,
  templateImages = [],
}: ProductDetailProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [selectedVariantId] = useState(currentVariant.id);

  const selectedVariant =
    allVariants.find((v) => v.id === selectedVariantId) || currentVariant;
  const priceTiers = priceTiersByVariant[selectedVariantId] || [];
  const template = currentVariant.product_templates;

  // Get minimum order quantity (variant > template > 1)
  const minOrderQuantity =
    selectedVariant.min_order_quantity ?? template.min_order_quantity ?? 1;
  const [quantity, setQuantity] = useState(minOrderQuantity);

  // Reset quantity to minimum when variant changes
  useEffect(() => {
    setQuantity(minOrderQuantity);
  }, [selectedVariantId, minOrderQuantity]);

  // Get template images by type
  const mainImage = templateImages.find((img) => img.image_type === "main");
  const templateTechnicalImage = templateImages.find(
    (img) => img.image_type === "technical",
  );
  const galleryImages = templateImages.filter(
    (img) => img.image_type === "gallery",
  );

  // Technical image: variant > template
  const technicalImageUrl =
    selectedVariant.technical_image_url || templateTechnicalImage?.image_url;

  // Determine the primary image to show (template main > variant main > placeholder)
  const primaryImageUrl =
    mainImage?.image_url ||
    selectedVariant.main_image_url ||
    "https://placehold.co/800x800?text=Imagem";

  // State for currently displayed image in gallery
  const [selectedImageUrl, setSelectedImageUrl] = useState(primaryImageUrl);

  // Reset selected image when variant changes
  useEffect(() => {
    setSelectedImageUrl(primaryImageUrl);
  }, [selectedVariantId, primaryImageUrl]);

  // Build array of all gallery-clickable images (main + gallery images)
  const allGalleryImages = [
    { id: "main", url: primaryImageUrl, alt: template.name },
    ...galleryImages.map((img) => ({
      id: `gallery-${img.id}`,
      url: img.image_url,
      alt: img.alt_text || "Imagem",
    })),
  ];

  const handleVariantChange = (variantId: number) => {
    const variant = allVariants.find((v) => v.id === variantId);
    if (variant) {
      router.push(`/produtos/${variant.url_slug}`);
    }
  };

  const getCurrentPrice = () => {
    if (priceTiers.length === 0) {
      return selectedVariant.base_price_including_vat;
    }
    const tier = priceTiers.find(
      (t) =>
        quantity >= t.min_quantity &&
        (t.max_quantity === null || quantity <= t.max_quantity),
    );
    return tier
      ? tier.price_per_unit
      : selectedVariant.base_price_including_vat;
  };

  const handleAddToCart = () => {
    addToCart({
      variantId: selectedVariant.id,
      sku: selectedVariant.sku,
      productName: template.name,
      sizeName: selectedVariant.size_formats.name,
      quantity: quantity,
      unitPrice: getCurrentPrice(),
      imageUrl: selectedVariant.main_image_url,
      stockQuantity: selectedVariant.stock_quantity,
    });

    toast({
      title: "Produto adicionado ao carrinho",
      description: `${quantity}x ${template.name} - ${selectedVariant.size_formats.name}`,
    });

    setQuantity(1);
  };

  const currentPrice = getCurrentPrice();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 lg:px-6 pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image Gallery */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <div className="relative w-full aspect-square border border-dashed border-[var(--color-base-500)] rounded-[4px] overflow-hidden">
              <Image
                src={selectedImageUrl}
                alt={template.name}
                fill
                className="object-cover"
              />
              {selectedVariant.is_bestseller && (
                <Badge className="absolute top-3 right-3">Bestseller</Badge>
              )}
            </div>
            {/* Thumbnail strip - show if more than 1 image */}
            {allGalleryImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3 mt-4">
                {allGalleryImages.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImageUrl(img.url)}
                    className={`relative w-full aspect-square rounded-[4px] overflow-hidden transition-colors ${selectedImageUrl === img.url
                      ? "border-2 border-solid border-[var(--accent-100)]"
                      : "border border-dashed border-[var(--color-base-500)] hover:border-[var(--accent-100)]"
                      }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-light text-foreground leading-tight mb-2">
              {template.name}
            </h1>
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-6">
              Ref.: {template.reference_code || selectedVariant.sku}
            </p>

            {/* Price */}
            <div
              className="text-2xl lg:text-3xl mb-1"
              style={{ color: "var(--accent-100)" }}
            >
              {currentPrice.toFixed(2)}€
              {allVariants.length > 1 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({selectedVariant.size_formats?.name})
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">IVA incluído</p>
            {minOrderQuantity > 1 && (
              <p className="text-xs text-muted-foreground mt-1 mb-6">
                Quantidade mínima: {minOrderQuantity} unidades
              </p>
            )}
            {minOrderQuantity <= 1 && <div className="mb-6" />}

            {/* Size Selector */}
            <div className="mb-5">
              <p className="text-xs uppercase tracking-wide text-foreground mb-2">
                Dimensões:
              </p>
              <div className="flex flex-wrap gap-2">
                {allVariants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => handleVariantChange(variant.id)}
                    className={`h-8 px-3.5 text-xs font-normal uppercase tracking-wide transition-all rounded-[2px] bg-transparent text-foreground ${variant.id === selectedVariantId
                      ? "border border-solid border-[var(--accent-100)]"
                      : "border border-dashed border-[var(--color-base-500)] hover:border-[var(--accent-100)]"
                      }`}
                    style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: "12px",
                    }}
                  >
                    {variant.size_formats.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector + Price + Carrinho Button */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center border border-dashed border-[var(--color-base-500)] h-8 rounded-[2px]">
                <button
                  onClick={() =>
                    setQuantity(Math.max(minOrderQuantity, quantity - 1))
                  }
                  className="w-8 h-full border-r border-dashed border-[var(--color-base-500)] hover:border-[var(--accent-100)] transition-colors text-center text-sm font-normal text-foreground"
                  disabled={quantity <= minOrderQuantity}
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(
                        minOrderQuantity,
                        Number.parseInt(e.target.value) || minOrderQuantity,
                      ),
                    )
                  }
                  className="w-14 text-center bg-transparent border-none focus:outline-none text-xs font-normal text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1"
                  max={MAX_CART_QUANTITY}
                />
                <button
                  onClick={() => setQuantity(Math.min(quantity + 1, MAX_CART_QUANTITY))}
                  className="w-8 h-full border-l border-dashed border-[var(--color-base-500)] hover:border-[var(--accent-100)] transition-colors text-center text-sm font-normal text-foreground"
                  disabled={quantity >= MAX_CART_QUANTITY}
                >
                  +
                </button>
              </div>

              {/* Current unit price based on quantity */}
              <span
                className="text-sm font-normal"
                style={{ color: "var(--accent-100)" }}
              >
                {currentPrice.toFixed(2)}€/un
              </span>

              <Button
                className="flex-1 h-8 px-4 text-xs"
                onClick={handleAddToCart}
              >
                + Carrinho
              </Button>
            </div>

            {/* Solicitar Orçamento (full width) */}
            <Button className="w-full h-9 mb-5 text-xs" variant="outline">
              Solicitar Orçamento
            </Button>

            {/* Quantity Discounts */}
            {priceTiers && priceTiers.length > 0 && (
              <div className="mb-5 p-3 border border-dashed border-[var(--color-base-500)] rounded-[2px]">
                <p className="text-xs uppercase tracking-wide text-foreground mb-2">
                  Descontos por quantidade:
                </p>
                <div className="space-y-0">
                  {priceTiers.map((tier, index) => (
                    <div
                      key={tier.id}
                      className={`flex justify-between items-center h-8 px-3 transition-colors hover:bg-muted/50 ${index < priceTiers.length - 1 ? "border-b border-dashed border-[var(--color-base-500)]" : ""}`}
                    >
                      <span className="text-sm font-normal text-muted-foreground">
                        {tier.min_quantity} unidades
                      </span>
                      <span
                        className="text-sm font-normal"
                        style={{ color: "var(--accent-100)" }}
                      >
                        {tier.price_per_unit.toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-dashed border-[var(--color-base-500)]">
              <div className="flex items-start gap-2 text-muted-foreground hover:text-[var(--accent-100)] transition-colors">
                <Truck
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs uppercase tracking-wide">Envio</p>
                  <p className="text-xs normal-case">1-3 dias</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground hover:text-[var(--accent-100)] transition-colors">
                <Lock
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs uppercase tracking-wide">Pagamento</p>
                  <p className="text-xs normal-case">Seguro</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground hover:text-[var(--accent-100)] transition-colors">
                <Flag
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs uppercase tracking-wide">Fabricado</p>
                  <p className="text-xs normal-case">Portugal</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === STACKED SECTIONS === */}

        {/* SECTION 1: ESPECIFICAÇÕES TÉCNICAS (First and Key!) */}
        <section className="mt-20 pt-16 border-t border-dashed border-[var(--color-base-500)]">
          <div className="flex items-center gap-4 mb-10">
            <span
              className="text-xs uppercase tracking-widest"
              style={{ color: "var(--accent-100)" }}
            >
              01
            </span>
            <h2 className="text-xl font-light text-foreground">
              Especificações Técnicas
            </h2>
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: "var(--color-base-500)" }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Technical Image - Left side, prominent */}
            <div>
              <div className="border border-dashed border-[var(--color-base-500)] rounded-[4px] p-6 bg-[var(--color-dark-base-primary)]">
                {technicalImageUrl ? (
                  <Image
                    src={technicalImageUrl}
                    alt="Diagrama técnico"
                    width={800}
                    height={600}
                    className="w-full h-auto object-contain"
                  />
                ) : (
                  <div className="aspect-[4/3] flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        Diagrama Técnico
                      </p>
                      <p className="text-xs text-muted-foreground">Em breve</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Specifications Table - Right side */}
            {/* Use variant specs if available, fallback to template specs */}
            <div className="flex flex-col justify-center">
              {selectedVariant.specifications_json ? (
                <StructuredSpecifications
                  specs={selectedVariant.specifications_json}
                />
              ) : template.specifications_json ? (
                <StructuredSpecifications
                  specs={template.specifications_json}
                />
              ) : (
                <p className="text-muted-foreground text-sm">
                  Especificações em breve.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 2: DESCRIÇÃO + FAQ Side by Side */}
        <section className="mt-20 pt-16 border-t border-dashed border-[var(--color-base-500)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Left: Descrição */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <span
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "var(--accent-100)" }}
                >
                  02
                </span>
                <h2 className="text-xl font-light text-foreground">
                  Descrição
                </h2>
                <div
                  className="flex-1 h-px"
                  style={{ backgroundColor: "var(--color-base-500)" }}
                />
              </div>

              {template.full_description ? (
                <div
                  className="text-sm leading-relaxed text-foreground font-mono space-y-4 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline [&_a]:text-[var(--accent-100)] [&_a]:underline [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1"
                  dangerouslySetInnerHTML={{
                    __html: template.full_description.includes("<")
                      ? template.full_description
                      : template.full_description
                        .split("\n\n")
                        .map(
                          (p: string) => `<p>${p.replace(/\n/g, "<br>")}</p>`,
                        )
                        .join(""),
                  }}
                />
              ) : (
                <p className="text-muted-foreground leading-relaxed text-sm font-mono">
                  Descrição completa em breve.
                </p>
              )}

              {template.advantages && (
                <div className="mt-8 p-5 border border-dashed border-[var(--color-base-500)] rounded-[4px]">
                  <h3
                    className="text-xs uppercase tracking-widest mb-3"
                    style={{ color: "var(--accent-100)" }}
                  >
                    Vantagens
                  </h3>
                  <div
                    className="text-sm leading-relaxed text-foreground font-mono space-y-4 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline [&_a]:text-[var(--accent-100)] [&_a]:underline [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1"
                    dangerouslySetInnerHTML={{
                      __html: template.advantages.includes("<")
                        ? template.advantages
                        : template.advantages
                          .split("\n\n")
                          .map(
                            (p: string) =>
                              `<p>${p.replace(/\n/g, "<br>")}</p>`,
                          )
                          .join(""),
                    }}
                  />
                </div>
              )}
            </div>

            {/* Right: FAQ */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <span
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "var(--accent-100)" }}
                >
                  03
                </span>
                <h2 className="text-xl font-light text-foreground">
                  Perguntas Frequentes
                </h2>
                <div
                  className="flex-1 h-px"
                  style={{ backgroundColor: "var(--color-base-500)" }}
                />
              </div>

              {template.faq && template.faq.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {template.faq.map(
                    (
                      faq: { question: string; answer: string },
                      index: number,
                    ) => (
                      <AccordionItem
                        key={index}
                        value={`faq-${index}`}
                        className="border-b border-dashed border-[var(--color-base-500)]"
                      >
                        <AccordionTrigger className="text-sm text-foreground hover:no-underline hover:text-[var(--accent-100)] text-left py-4">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-muted-foreground leading-relaxed pb-2">
                            {faq.answer}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ),
                  )}
                </Accordion>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Sem perguntas frequentes disponíveis.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 3: APLICAÇÕES */}
        <section className="mt-20 pt-16 border-t border-dashed border-[var(--color-base-500)]">
          <div className="flex items-center gap-4 mb-10">
            <span
              className="text-xs uppercase tracking-widest"
              style={{ color: "var(--accent-100)" }}
            >
              04
            </span>
            <h2 className="text-xl font-light text-foreground">Aplicações</h2>
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: "var(--color-base-500)" }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card: Restaurantes */}
            <div className="group p-6 border border-dashed border-[var(--color-base-500)] rounded-[4px] hover:border-[var(--accent-100)] transition-colors">
              <UtensilsCrossed
                className="w-6 h-6 mb-4 text-muted-foreground group-hover:text-[var(--accent-100)] transition-colors"
                strokeWidth={1.5}
              />
              <h4 className="text-sm uppercase tracking-wide text-foreground mb-3">
                Restaurantes
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>Menus de mesa</li>
                <li>Carta de vinhos</li>
                <li>Promoções do dia</li>
                <li>Menu de sobremesas</li>
              </ul>
            </div>

            {/* Card: Hotelaria */}
            <div className="group p-6 border border-dashed border-[var(--color-base-500)] rounded-[4px] hover:border-[var(--accent-100)] transition-colors">
              <Building2
                className="w-6 h-6 mb-4 text-muted-foreground group-hover:text-[var(--accent-100)] transition-colors"
                strokeWidth={1.5}
              />
              <h4 className="text-sm uppercase tracking-wide text-foreground mb-3">
                Hotelaria
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>Informações de quarto</li>
                <li>Serviços disponíveis</li>
                <li>Horários</li>
                <li>Contactos úteis</li>
              </ul>
            </div>

            {/* Card: Comércio */}
            <div className="group p-6 border border-dashed border-[var(--color-base-500)] rounded-[4px] hover:border-[var(--accent-100)] transition-colors">
              <Store
                className="w-6 h-6 mb-4 text-muted-foreground group-hover:text-[var(--accent-100)] transition-colors"
                strokeWidth={1.5}
              />
              <h4 className="text-sm uppercase tracking-wide text-foreground mb-3">
                Comércio
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>Preçários</li>
                <li>Características</li>
                <li>Promoções</li>
                <li>Novidades</li>
              </ul>
            </div>

            {/* Card: Escritórios */}
            <div className="group p-6 border border-dashed border-[var(--color-base-500)] rounded-[4px] hover:border-[var(--accent-100)] transition-colors">
              <Briefcase
                className="w-6 h-6 mb-4 text-muted-foreground group-hover:text-[var(--accent-100)] transition-colors"
                strokeWidth={1.5}
              />
              <h4 className="text-sm uppercase tracking-wide text-foreground mb-3">
                Escritórios
              </h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>Recepção</li>
                <li>Salas de reunião</li>
                <li>Avisos internos</li>
                <li>Directórios</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
