"""
Product Import Script for Jocril
Imports products from jocril_products_enriched.json where _keep=true
"""

import json
import os
import re

from dotenv import load_dotenv

from supabase import create_client

# Load environment
load_dotenv(".env.local")

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)
supabase = create_client(url, key)

# Category mapping from JSON category names to DB category IDs
CATEGORY_MAP = {
    # JSON category_id -> DB category_id
    "3": 2,  # Acrílicos -> Acrílicos Mesa (default)
    "6": 2,  # Packs Completos -> Acrílicos Mesa
    "21": 3,  # Acrílicos de Parede -> Acrílicos Parede
    "8": 2,  # Acrílicos de Balcão / Mesa -> Acrílicos Mesa
    "165": 4,  # Caixas -> Caixas Acrílico
    "62": 1,  # Acrílico de Chão -> Acrílicos Chão
    "167": 6,  # Tômbolas -> Tombolas Acrílico
    "4": 3,  # Sistemas de Cabo de Aço -> Acrílicos Parede
    "23": 2,  # Expositores Por Atividade -> Acrílicos Mesa
    "25": 2,  # TVDE -> Acrílicos Mesa
    "179": 2,  # Decoração -> Acrílicos Mesa
    "24": 2,  # Produtos Personalizados -> Acrílicos Mesa
    "214": 2,  # Identificadores -> Acrílicos Mesa
    "220": 3,  # superfícies metálicas -> Acrílicos Parede
    "222": 3,  # Para Vidro ou montras -> Acrílicos Parede
    "223": 2,  # Resistente à água -> Acrílicos Mesa
    "246": 4,  # Caixas para LEGO -> Caixas Acrílico
}

# Size format mapping from variation names to DB size_format IDs
SIZE_FORMAT_MAP = {
    "a1": 1,
    "a2": 2,
    "a3": 3,
    "a4": 4,
    "a5": 5,
    "a6": 6,
    "a7": 7,
    "dl": 8,
    "1/3 a4": 9,
    "1/3a4": 9,
}

DEFAULT_MATERIAL_ID = 4  # Acrílico (generic)
DEFAULT_SIZE_FORMAT_ID = 10  # Único (for products without standard sizes)
VAT_RATE = 0.23  # 23% IVA in Portugal


def slugify(name):
    """Convert name to URL-friendly slug"""
    slug = name.lower()
    replacements = {
        "/": "-",
        "(": "",
        ")": "",
        ",": "",
        ".": "",
        "®": "",
        '"': "",
        "'": "",
        "+": "-",
        "ç": "c",
        "ã": "a",
        "á": "a",
        "à": "a",
        "â": "a",
        "é": "e",
        "ê": "e",
        "í": "i",
        "ó": "o",
        "ô": "o",
        "õ": "o",
        "ú": "u",
        "º": "",
        "  ": " ",
    }
    for old, new in replacements.items():
        slug = slug.replace(old, new)
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    slug = slug.strip("-")
    return slug


def parse_price(price_str):
    """Parse price string like '2,50 €' to float"""
    if not price_str:
        return 0.0
    price = price_str.replace("€", "").replace(" ", "").replace(",", ".").strip()
    try:
        return float(price)
    except:
        return 0.0


def get_size_format_id(variation_name):
    """Extract size format ID from variation name like 'A4 (21x30cm)'"""
    name_lower = variation_name.lower()
    for size_key, size_id in SIZE_FORMAT_MAP.items():
        if size_key in name_lower:
            return size_id
    return None


def find_local_image(product_name, img_dir="public/imagens_produto"):
    """Find matching local image for product"""
    if not os.path.exists(img_dir):
        return None

    slug = slugify(product_name)
    local_images = os.listdir(img_dir)

    for img in local_images:
        img_lower = img.lower()
        img_base = img_lower.rsplit(".", 1)[0]

        # Skip technical images for main image
        if "_tecnico" in img_lower:
            continue

        if img_base == slug or slug in img_base or img_base in slug:
            return f"/imagens_produto/{img}"

    return None


def find_technical_image(product_name, img_dir="public/imagens_produto"):
    """Find matching technical image for product"""
    if not os.path.exists(img_dir):
        return None

    slug = slugify(product_name)
    local_images = os.listdir(img_dir)

    for img in local_images:
        img_lower = img.lower()
        if "_tecnico" in img_lower:
            img_base = img_lower.replace("_tecnico", "").rsplit(".", 1)[0]
            if slug in img_base or img_base in slug:
                return f"/imagens_produto/{img}"

    return None


def import_products(dry_run=True):
    """Import products from JSON to database"""

    # Load JSON data
    with open("public/TEMP/jocril_products_enriched.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    # Filter to _keep=true only
    products = [p for p in data["products"] if p.get("_keep") == True]
    print(f"Importing {len(products)} products (_keep=true)")

    if dry_run:
        print("\n=== DRY RUN MODE - No changes will be made ===\n")

    imported = 0
    skipped = 0
    errors = []

    for product in products:
        try:
            name = product["name"]
            slug = slugify(name)

            # Check if already exists
            existing = (
                supabase.table("product_templates")
                .select("id")
                .eq("slug", slug)
                .execute()
            )
            if existing.data:
                print(f"  SKIP (exists): {name[:50]}")
                skipped += 1
                continue

            # Get category
            json_cat_id = (
                product.get("_newCategory") or product.get("category_id") or "3"
            )
            db_category_id = CATEGORY_MAP.get(str(json_cat_id), 2)

            # Extract reference code from manufacturer field
            manufacturer = product.get("manufacturer", "")
            ref_code = None
            if "Referência:" in manufacturer:
                ref_code = (
                    manufacturer.split("Referência:")[-1].strip().split("\n")[0].strip()
                )

            # Find images
            main_image = find_local_image(name)
            technical_image = find_technical_image(name)

            # Build template data
            template_data = {
                "name": name,
                "slug": slug,
                "reference_code": ref_code,
                "sku_prefix": ref_code[:10] if ref_code else slug[:10].upper(),
                "category_id": db_category_id,
                "material_id": DEFAULT_MATERIAL_ID,
                "short_description": product.get("resumo"),
                "full_description": product.get("descricao_completa"),
                "advantages": product.get("vantagens"),
                "specifications_text": product.get("notas"),
                "is_active": True,
                "is_featured": False,
                "orientation": "vertical",
                "min_order_quantity": 1,
            }

            # Handle specifications_json
            specs = product.get("especificacoes_tecnicas")
            if specs:
                template_data["specifications_json"] = specs

            if dry_run:
                print(f"  WOULD INSERT template: {name[:50]}")
                print(f"    Category: {db_category_id}, Image: {main_image or 'None'}")

                # Show variations
                variations = product.get("variations", [])
                for var in variations:
                    if var.get("_keep", True):
                        price_inc = parse_price(var.get("price"))
                        print(
                            f"    -> Variant: {var.get('name', 'Standard')} @ {price_inc}€"
                        )
            else:
                # Insert template
                result = (
                    supabase.table("product_templates").insert(template_data).execute()
                )
                template_id = result.data[0]["id"]

                # Insert main image if found
                if main_image:
                    supabase.table("product_template_images").insert(
                        {
                            "product_template_id": template_id,
                            "image_url": main_image,
                            "image_type": "main",
                            "display_order": 0,
                        }
                    ).execute()

                # Insert technical image if found
                if technical_image:
                    supabase.table("product_template_images").insert(
                        {
                            "product_template_id": template_id,
                            "image_url": technical_image,
                            "image_type": "technical",
                            "display_order": 1,
                        }
                    ).execute()

                # Insert variants
                variations = product.get("variations", [])
                for idx, var in enumerate(variations):
                    if not var.get("_keep", True):
                        continue

                    var_name = var.get("name", "Standard")
                    price_inc_vat = parse_price(var.get("price"))
                    price_exc_vat = round(price_inc_vat / (1 + VAT_RATE), 2)

                    size_format_id = (
                        get_size_format_id(var_name) or DEFAULT_SIZE_FORMAT_ID
                    )

                    var_slug = (
                        f"{slug}-{slugify(var_name)}"
                        if var_name != "Standard"
                        else slug
                    )

                    variant_data = {
                        "product_template_id": template_id,
                        "size_format_id": size_format_id,
                        "sku": var.get("sku", f"{ref_code}-{idx}"),
                        "url_slug": var_slug,
                        "orientation": "vertical",
                        "base_price_excluding_vat": price_exc_vat,
                        "base_price_including_vat": price_inc_vat,
                        "stock_quantity": 100,
                        "stock_status": "in_stock",
                        "is_active": True,
                        "display_order": idx,
                        "main_image_url": main_image,
                    }

                    if technical_image:
                        variant_data["technical_image_url"] = technical_image

                    supabase.table("product_variants").insert(variant_data).execute()

                print(f"  IMPORTED: {name[:50]} (ID: {template_id})")

            imported += 1

        except Exception as e:
            errors.append((product.get("name", "Unknown"), str(e)))
            print(f"  ERROR: {product.get('name', 'Unknown')[:40]} - {str(e)[:50]}")

    print(f"\n=== SUMMARY ===")
    print(f"Imported: {imported}")
    print(f"Skipped (already exist): {skipped}")
    print(f"Errors: {len(errors)}")

    if errors:
        print("\nErrors:")
        for name, err in errors[:10]:
            print(f"  - {name[:40]}: {err[:60]}")


if __name__ == "__main__":
    import sys

    dry_run = "--execute" not in sys.argv

    if dry_run:
        print("Running in DRY RUN mode. Use --execute to actually import.")

    import_products(dry_run=dry_run)
