"""
Fix missing variants - adds variants that failed due to duplicate constraints
"""

import json
import os
import re

from dotenv import load_dotenv

from supabase import create_client

load_dotenv(".env.local")

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)
supabase = create_client(url, key)

VAT_RATE = 0.23


def slugify(name):
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
    return slug.strip("-")


def parse_price(price_str):
    if not price_str:
        return 0.0
    price = price_str.replace("€", "").replace(" ", "").replace(",", ".").strip()
    try:
        return float(price)
    except:
        return 0.0


def build_size_format_map():
    """Build map from variation name to size_format_id"""
    sizes = supabase.table("size_formats").select("id, name, code").execute()

    size_map = {}
    for s in sizes.data:
        # Map by exact name (case insensitive)
        size_map[s["name"].lower()] = s["id"]
        if s["code"]:
            size_map[s["code"].lower()] = s["id"]

    return size_map


def get_size_format_id(var_name, size_map):
    """Get size format ID for a variation name"""
    var_lower = var_name.lower()

    # Try exact match first
    if var_lower in size_map:
        return size_map[var_lower]

    # Try common patterns
    patterns = [
        (r"a(\d)", lambda m: f"a{m.group(1)}"),  # A4, A5, etc
        (r"dl", lambda m: "dl"),
        (r"1/3 a4", lambda m: "1/3 a4"),
    ]

    for pattern, extractor in patterns:
        match = re.search(pattern, var_lower)
        if match:
            key = extractor(match)
            if key in size_map:
                return size_map[key]

    # Handle special mappings for base colors
    special_maps = {
        "20x20x20cm - base branca": "20x20x20 base brnc",
        "20x20x20cm - base preta": "20x20x20 base prt",
        "30x30x30cm - base branca": "30x30x30 base brnc",
        "30x30x30cm - base preta": "30x30x30 base prt",
    }
    if var_name in special_maps:
        mapped = special_maps[var_name].lower()
        if mapped in size_map:
            return size_map[mapped]

    # Default to 'Único' (ID 10)
    return size_map.get("único", 10)


def find_local_image(product_name, img_dir="public/imagens_produto"):
    if not os.path.exists(img_dir):
        return None
    slug = slugify(product_name)
    for img in os.listdir(img_dir):
        img_lower = img.lower()
        if "_tecnico" in img_lower:
            continue
        img_base = img_lower.rsplit(".", 1)[0]
        if img_base == slug or slug in img_base or img_base in slug:
            return f"/imagens_produto/{img}"
    return None


def fix_missing_variants():
    with open("public/TEMP/jocril_products_enriched.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    products = [p for p in data["products"] if p.get("_keep") == True]

    # Build size format map
    size_map = build_size_format_map()
    print(f"Loaded {len(size_map)} size format mappings")

    # Get existing templates
    templates = supabase.table("product_templates").select("id, slug, name").execute()
    template_by_slug = {t["slug"]: t for t in templates.data}

    # Get existing variants by SKU
    db_variants = supabase.table("product_variants").select("sku").execute()
    db_skus = set(v["sku"] for v in db_variants.data)

    added = 0
    errors = []

    for product in products:
        slug = slugify(product["name"])

        if slug not in template_by_slug:
            continue

        template = template_by_slug[slug]
        main_image = find_local_image(product["name"])

        variations = [v for v in product.get("variations", []) if v.get("_keep", True)]

        for idx, var in enumerate(variations):
            sku = var.get("sku")

            # Skip if already exists
            if sku in db_skus:
                continue

            try:
                var_name = var.get("name", "Standard")
                price_inc_vat = parse_price(var.get("price"))
                price_exc_vat = round(price_inc_vat / (1 + VAT_RATE), 2)

                # Get correct size format ID
                size_format_id = get_size_format_id(var_name, size_map)

                # Generate unique slug
                base_slug = (
                    f"{slug}-{slugify(var_name)}" if var_name != "Standard" else slug
                )
                var_slug = f"{base_slug}-{sku.lower()}"

                variant_data = {
                    "product_template_id": template["id"],
                    "size_format_id": size_format_id,
                    "sku": sku,
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

                supabase.table("product_variants").insert(variant_data).execute()
                db_skus.add(sku)
                added += 1
                print(
                    f"  Added: {product['name'][:40]} -> {var_name} (size_format: {size_format_id})"
                )

            except Exception as e:
                errors.append((product["name"], var_name, str(e)))
                print(f"  ERROR: {product['name'][:30]} / {var_name}: {str(e)[:60]}")

    print(f"\n=== SUMMARY ===")
    print(f"Variants added: {added}")
    print(f"Errors: {len(errors)}")


if __name__ == "__main__":
    fix_missing_variants()
