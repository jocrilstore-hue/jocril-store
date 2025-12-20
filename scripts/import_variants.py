"""
Import variants for existing product templates
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

DEFAULT_SIZE_FORMAT_ID = 10
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


def get_size_format_id(variation_name):
    name_lower = variation_name.lower()
    for size_key, size_id in SIZE_FORMAT_MAP.items():
        if size_key in name_lower:
            return size_id
    return DEFAULT_SIZE_FORMAT_ID


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


def find_technical_image(product_name, img_dir="public/imagens_produto"):
    if not os.path.exists(img_dir):
        return None
    slug = slugify(product_name)
    for img in os.listdir(img_dir):
        img_lower = img.lower()
        if "_tecnico" in img_lower:
            img_base = img_lower.replace("_tecnico", "").rsplit(".", 1)[0]
            if slug in img_base or img_base in slug:
                return f"/imagens_produto/{img}"
    return None


def import_variants():
    with open("public/TEMP/jocril_products_enriched.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    products = [p for p in data["products"] if p.get("_keep") == True]

    templates = supabase.table("product_templates").select("id, slug, name").execute()
    template_by_slug = {t["slug"]: t for t in templates.data}

    existing_variants = (
        supabase.table("product_variants").select("product_template_id").execute()
    )
    templates_with_variants = set(
        v["product_template_id"] for v in existing_variants.data
    )

    added = 0
    skipped = 0
    errors = []

    for product in products:
        slug = slugify(product["name"])

        if slug not in template_by_slug:
            continue

        template = template_by_slug[slug]

        if template["id"] in templates_with_variants:
            skipped += 1
            continue

        main_image = find_local_image(product["name"])
        technical_image = find_technical_image(product["name"])

        manufacturer = product.get("manufacturer", "")
        ref_code = None
        if "Referência:" in manufacturer:
            ref_code = (
                manufacturer.split("Referência:")[-1].strip().split("\n")[0].strip()
            )

        variations = product.get("variations", [])
        var_count = 0

        for idx, var in enumerate(variations):
            if not var.get("_keep", True):
                continue

            try:
                var_name = var.get("name", "Standard")
                price_inc_vat = parse_price(var.get("price"))
                price_exc_vat = round(price_inc_vat / (1 + VAT_RATE), 2)
                size_format_id = get_size_format_id(var_name)

                var_slug = (
                    f"{slug}-{slugify(var_name)}" if var_name != "Standard" else slug
                )

                variant_data = {
                    "product_template_id": template["id"],
                    "size_format_id": size_format_id,
                    "sku": var.get("sku", f"{ref_code or slug[:8]}-{idx}"),
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
                added += 1
                var_count += 1

            except Exception as e:
                errors.append((product["name"], var_name, str(e)))

        if var_count > 0:
            print(f"  Added {var_count} variants for: {template['name'][:50]}")

    print(f"\n=== SUMMARY ===")
    print(f"Variants added: {added}")
    print(f"Templates skipped (had variants): {skipped}")
    print(f"Errors: {len(errors)}")

    if errors:
        print("\nSample errors:")
        for name, var, err in errors[:5]:
            print(f"  {name[:30]} / {var}: {err[:50]}")


if __name__ == "__main__":
    import_variants()
