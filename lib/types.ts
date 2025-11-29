export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number;
}

export interface SizeFormat {
  id: number;
  name: string;
  width_mm: number;
  height_mm: number;
  width_cm: number;
  height_cm: number;
}

export interface ProductTemplate {
  id: number;
  name: string;
  slug: string;
  sku_prefix: string;
  category_id: number;
  short_description?: string;
  full_description?: string;
  advantages?: string;
  faq?: any;
  orientation?: string;
  has_lock: boolean;
  is_double_sided: boolean;
  is_active: boolean;
  is_featured: boolean;
}

export interface ProductVariant {
  id: number;
  product_template_id: number;
  size_format_id: number;
  sku: string;
  orientation?: string;
  base_price_excluding_vat: number;
  base_price_including_vat: number;
  stock_quantity: number;
  stock_status: string;
  url_slug: string;
  main_image_url?: string;
  specific_description?: string;
  ideal_for?: string;
  is_active: boolean;
  is_bestseller: boolean;
}

export interface PriceTier {
  id: number;
  product_variant_id: number;
  min_quantity: number;
  max_quantity?: number;
  discount_percentage: number;
  price_per_unit: number;
}

export interface ProductImage {
  id: number;
  product_variant_id: number;
  image_url: string;
  image_type: string;
  alt_text?: string;
  display_order: number;
}

export interface ProductTemplateImage {
  id: number;
  product_template_id: number;
  image_url: string;
  image_type: "main" | "gallery" | "technical";
  alt_text?: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFull {
  variant: ProductVariant;
  template: ProductTemplate;
  category: Category;
  size_format: SizeFormat;
  price_tiers: PriceTier[];
  images: ProductImage[];
}

export interface CartItem {
  variantId: number;
  sku: string;
  productName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
  stockQuantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

// Structured product specifications
export interface ProductSpecifications {
  produto: {
    largura_mm: number | null;
    altura_mm: number | null;
    profundidade_mm: number | null;
  };
  area_grafica: {
    largura_mm: number | null;
    altura_mm: number | null;
    formato: string | null; // e.g., "A6", "A5", "A4"
    impressao: "frente" | "verso" | "frente_verso" | null;
    num_cores: number | null;
  };
  notas: string | null;
  extras: Array<{
    label: string;
    value: string;
  }>;
}
