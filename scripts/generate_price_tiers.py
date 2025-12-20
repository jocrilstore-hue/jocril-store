"""
Generate price tiers for all product variants based on VALUE thresholds.

Discount structure (based on order total value):
- > €200  → 0.5% discount
- > €400  → 1% discount
- > €800  → 1.5% discount
- > €1000 → 3% discount

Quantities are rounded up to nice numbers (nearest 5, 10, 20, 50, 100).
"""

import os

from dotenv import load_dotenv

from supabase import create_client

load_dotenv(".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Discount tiers based on order VALUE
VALUE_TIERS = [
    {"min_value": 200, "discount_pct": 0.5},
    {"min_value": 400, "discount_pct": 1.0},
    {"min_value": 800, "discount_pct": 1.5},
    {"min_value": 1000, "discount_pct": 3.0},
]


def round_to_nice(qty: int) -> int:
    """Round up to nice display numbers."""
    if qty <= 10:
        return qty
    if qty <= 50:
        return ((qty + 4) // 5) * 5  # Round up to nearest 5
    if qty <= 100:
        return ((qty + 9) // 10) * 10  # Round up to nearest 10
    if qty <= 500:
        return ((qty + 19) // 20) * 20  # Round up to nearest 20
    if qty <= 1000:
        return ((qty + 49) // 50) * 50  # Round up to nearest 50
    return ((qty + 99) // 100) * 100  # Round up to nearest 100


def round_price_to_half(price: float) -> float:
    """Round price to nearest 0.50€."""
    return round(price * 2) / 2


def generate_tiers_for_variant(variant_id: int, base_price: float) -> list:
    """Generate value-based tiers with rounded quantities."""
    tiers = []

    if base_price <= 0:
        return tiers

    prev_max_qty = 0

    for i, tier in enumerate(VALUE_TIERS):
        raw_min_qty = int((tier["min_value"] / base_price) + 0.999)  # ceil
        min_qty = round_to_nice(raw_min_qty)

        # Skip if this tier's quantity is same or lower than previous
        if min_qty <= prev_max_qty:
            continue

        discount_pct = tier["discount_pct"]
        raw_price = base_price * (1 - discount_pct / 100)
        price_per_unit = round_price_to_half(raw_price)

        # Calculate max_quantity (rounded)
        max_qty = None
        if i < len(VALUE_TIERS) - 1:
            raw_next_min_qty = int(
                (VALUE_TIERS[i + 1]["min_value"] / base_price) + 0.999
            )
            next_min_qty = round_to_nice(raw_next_min_qty)
            if next_min_qty > min_qty:
                max_qty = next_min_qty - 1

        tiers.append(
            {
                "product_variant_id": variant_id,
                "min_quantity": min_qty,
                "max_quantity": max_qty,
                "discount_percentage": discount_pct,
                "price_per_unit": price_per_unit,
                "display_text": f"{min_qty} unidades",
            }
        )

        prev_max_qty = min_qty

    return tiers


def main():
    # Get all active variants
    result = (
        supabase.table("product_variants")
        .select("id, base_price_including_vat")
        .eq("is_active", True)
        .execute()
    )
    variants = result.data

    print(f"Found {len(variants)} active variants")

    # Delete ALL existing price tiers
    supabase.table("price_tiers").delete().neq("id", 0).execute()
    print("Deleted existing price tiers")

    all_tiers = []
    skipped = 0

    for variant in variants:
        variant_id = variant["id"]
        base_price = float(variant["base_price_including_vat"] or 0)

        if base_price <= 0:
            skipped += 1
            continue

        tiers = generate_tiers_for_variant(variant_id, base_price)
        all_tiers.extend(tiers)

    print(
        f"Generated {len(all_tiers)} price tiers for {len(variants) - skipped} variants"
    )
    print(f"Skipped {skipped} variants with no price")

    if all_tiers:
        # Insert in batches
        batch_size = 100
        for i in range(0, len(all_tiers), batch_size):
            batch = all_tiers[i : i + batch_size]
            supabase.table("price_tiers").insert(batch).execute()
            print(f"Inserted batch {i // batch_size + 1} ({len(batch)} tiers)")

    # Verify
    count = supabase.table("price_tiers").select("id", count="exact").execute()
    print(f"\nTotal price tiers in database: {count.count}")

    # Show example for a €2.50 product
    print("\nExample for €2.50 product:")
    for tier in VALUE_TIERS:
        raw_qty = int((tier["min_value"] / 2.50) + 0.999)
        nice_qty = round_to_nice(raw_qty)
        price = round(2.50 * (1 - tier["discount_pct"] / 100), 2)
        print(
            f"  >{tier['min_value']}€ → {nice_qty} unidades → {price}€/un (-{tier['discount_pct']}%)"
        )


if __name__ == "__main__":
    main()
