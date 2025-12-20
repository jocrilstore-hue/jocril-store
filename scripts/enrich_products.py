#!/usr/bin/env python3
"""
Jocril Product Enrichment Script

Enriches product data by:
1. Extracting technical specifications from _notes fields
2. Using AI (via OpenRouter API) to generate marketing copy
3. Outputting an enriched JSON file

Usage:
    $env:OPENROUTER_API_KEY='sk-or-v1-your-key-here'
    python enrich_products.py
"""

import json
import os
import re
import time
from datetime import datetime

import requests

# =============================================================================
# CONFIGURATION
# =============================================================================

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

# Models for round-robin rotation
MODELS = [
    "tngtech/tng-r1t-chimera:free",
    "openrouter/bert-nebulon-alpha",
    "x-ai/grok-4.1-fast:free",
    "openai/gpt-oss-20b:free",
]

# File paths
INPUT_FILE = r"C:\Users\maria\Downloads\jocril_products.json"
OUTPUT_FILE = r"C:\Users\maria\Downloads\jocril_products_enriched.json"
CHECKPOINT_FILE = r"C:\Users\maria\Downloads\jocril_checkpoint.json"

# Paper format mapping (width, height) -> format name
FORMAT_MAP = {
    (210, 297): "A4",
    (297, 210): "A4",  # landscape
    (148, 210): "A5",
    (210, 148): "A5",
    (105, 148): "A6",
    (148, 105): "A6",
    (99, 210): "DL",
    (210, 99): "DL",
    (100, 210): "DL",  # tolerance
    (210, 100): "DL",
    (99, 297): "1/3 A4",
    (297, 99): "1/3 A4",
    (100, 297): "1/3 A4",
}

# Global model index for round-robin
current_model_index = 0

# =============================================================================
# AI PROMPT TEMPLATE
# =============================================================================

PROMPT_TEMPLATE = """És um copywriter especializado em produtos de acrílico e expositores para o mercado português B2B.

PRODUTO: {name}
CATEGORIA: {category}
DESCRIÇÃO ATUAL: {description}
NOTAS TÉCNICAS: {notes}

Gera conteúdo comercial em Português de Portugal (PT-PT, não brasileiro).

REGRAS:
- Tom profissional mas acessível
- Foca em benefícios práticos para empresas
- Não uses chavões vazios
- Não inventes especificações técnicas
- VANTAGENS deve ser texto corrido (prosa), NÃO uses bullets ou listas

RESPONDE APENAS com JSON válido (sem markdown, sem ```):
{{
  "resumo": "Frase comercial apelativa, máximo 200 caracteres",
  "descricao_completa": "2-3 parágrafos descrevendo o produto, aplicações e características",
  "vantagens": "Texto corrido sobre benefícios: qualidade do material, durabilidade, facilidade de instalação, versatilidade, manutenção simples"
}}"""


# =============================================================================
# DIMENSION EXTRACTION FUNCTIONS
# =============================================================================


def infer_format(largura_mm: int, altura_mm: int) -> str | None:
    """Infer paper format from dimensions with ±5mm tolerance."""
    if largura_mm is None or altura_mm is None:
        return None

    for (w, h), fmt in FORMAT_MAP.items():
        if abs(largura_mm - w) <= 5 and abs(altura_mm - h) <= 5:
            return fmt
    return None


def extract_specifications(notes: str) -> dict:
    """Extract technical specifications from _notes field."""

    specs = {
        "produto": {"largura_mm": None, "altura_mm": None, "profundidade_mm": None},
        "area_grafica": {"largura_mm": None, "altura_mm": None, "formato": None},
        "impressao": "NÃO APLICÁVEL",
        "num_cores": 0,
    }

    if not notes:
        return specs

    # Normalize text for regex matching
    notes_normalized = notes.replace("\r\n", "\n").replace("\r", "\n")

    # Patterns for dimensions (case insensitive)
    patterns = {
        "largura": r"largura[:\s]*(\d+)\s*(?:mm)?",
        "altura": r"altura[:\s]*(\d+)\s*(?:mm)?",
        "profundidade": r"profundidade[:\s]*(\d+)\s*(?:mm)?",
    }

    # Split by "Área Gráfica" to separate produto from area_grafica
    # Handle various accent possibilities
    area_split_pattern = r"[áaÁA]rea\s*[gG]r[áaÁA]fica"
    parts = re.split(area_split_pattern, notes_normalized, flags=re.IGNORECASE)

    produto_section = parts[0] if parts else notes_normalized
    area_section = parts[1] if len(parts) > 1 else ""

    # Look for "Produto:" section first within produto_section
    produto_match = re.search(
        r"produto[:\s]*(.*?)(?:[áaÁA]rea|material|$)",
        produto_section,
        re.IGNORECASE | re.DOTALL,
    )
    if produto_match:
        produto_text = produto_match.group(1)
    else:
        produto_text = produto_section

    # Extract produto dimensions
    for dim, pattern in patterns.items():
        match = re.search(pattern, produto_text, re.IGNORECASE)
        if match:
            try:
                value = int(match.group(1))
                if dim == "largura":
                    specs["produto"]["largura_mm"] = value
                elif dim == "altura":
                    specs["produto"]["altura_mm"] = value
                elif dim == "profundidade":
                    specs["produto"]["profundidade_mm"] = value
            except ValueError:
                pass

    # Extract área gráfica dimensions
    if area_section:
        for dim in ["largura", "altura"]:
            pattern = patterns[dim]
            match = re.search(pattern, area_section, re.IGNORECASE)
            if match:
                try:
                    value = int(match.group(1))
                    if dim == "largura":
                        specs["area_grafica"]["largura_mm"] = value
                    elif dim == "altura":
                        specs["area_grafica"]["altura_mm"] = value
                except ValueError:
                    pass

    # Infer format from área gráfica
    if specs["area_grafica"]["largura_mm"] and specs["area_grafica"]["altura_mm"]:
        specs["area_grafica"]["formato"] = infer_format(
            specs["area_grafica"]["largura_mm"], specs["area_grafica"]["altura_mm"]
        )

    return specs


# =============================================================================
# OPENROUTER API FUNCTIONS
# =============================================================================


def call_openrouter(prompt: str, max_retries: int = 3) -> dict | None:
    """Call OpenRouter API with model rotation and retry logic."""
    global current_model_index

    model = MODELS[current_model_index]
    current_model_index = (current_model_index + 1) % len(MODELS)

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://jocril.com",
        "X-Title": "Jocril Product Enrichment",
    }

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 2000,
    }

    for attempt in range(max_retries):
        try:
            print(f"    Using model: {model.split('/')[-1][:30]}...")

            response = requests.post(
                OPENROUTER_BASE_URL, headers=headers, json=payload, timeout=120
            )

            if response.status_code == 429:
                # Rate limited - wait and retry with next model
                wait_time = 60 * (attempt + 1)
                print(f"    Rate limited on {model}, waiting {wait_time}s...")
                time.sleep(wait_time)
                model = MODELS[current_model_index]
                current_model_index = (current_model_index + 1) % len(MODELS)
                payload["model"] = model
                continue

            response.raise_for_status()
            result = response.json()

            if "choices" not in result or len(result["choices"]) == 0:
                print(f"    No choices in response: {result}")
                continue

            content = result["choices"][0]["message"]["content"]

            # Clean potential markdown wrapping
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            # Sanitize control characters inside JSON strings
            # Some models return unescaped newlines/tabs inside string values
            def sanitize_json_content(s):
                # Replace Windows and Unix line endings with escaped versions
                # But only inside quoted strings - we need a smarter approach
                result = []
                in_string = False
                escape_next = False
                for char in s:
                    if escape_next:
                        result.append(char)
                        escape_next = False
                        continue
                    if char == "\\":
                        escape_next = True
                        result.append(char)
                        continue
                    if char == '"':
                        in_string = not in_string
                        result.append(char)
                        continue
                    if in_string:
                        if char == "\n":
                            result.append("\\n")
                            continue
                        if char == "\r":
                            continue  # skip \r
                        if char == "\t":
                            result.append("\\t")
                            continue
                    result.append(char)
                return "".join(result)

            content = sanitize_json_content(content)

            # Try to extract JSON from content if it contains extra text
            json_match = re.search(
                r'\{[^{}]*"resumo"[^{}]*"descricao_completa"[^{}]*"vantagens"[^{}]*\}',
                content,
                re.DOTALL,
            )
            if json_match:
                content = json_match.group(0)

            return json.loads(content)

        except json.JSONDecodeError as e:
            print(f"    JSON parse error on attempt {attempt + 1}: {e}")
            print(
                f"    Raw content: {content[:200] if 'content' in dir() else 'N/A'}..."
            )
            if attempt < max_retries - 1:
                time.sleep(5)
                continue
            return None

        except requests.exceptions.Timeout:
            print(f"    Timeout on attempt {attempt + 1}")
            if attempt < max_retries - 1:
                time.sleep(10)
                continue
            return None

        except Exception as e:
            print(f"    API error on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                time.sleep(10)
                continue
            return None

    return None


# =============================================================================
# CHECKPOINT FUNCTIONS
# =============================================================================


def save_checkpoint(processed_ids: list, enriched_products: list):
    """Save progress to checkpoint file."""
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump(
            {
                "processed_ids": processed_ids,
                "enriched_products": enriched_products,
                "timestamp": datetime.now().isoformat(),
            },
            f,
            ensure_ascii=False,
            indent=2,
        )


def load_checkpoint() -> tuple:
    """Load progress from checkpoint file."""
    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("processed_ids", []), data.get("enriched_products", [])
        except Exception as e:
            print(f"Warning: Could not load checkpoint: {e}")
    return [], []


# =============================================================================
# MAIN PROCESSING
# =============================================================================


def process_products(input_file: str, output_file: str):
    """Main processing loop for product enrichment."""

    # Load input
    print(f"Loading input file: {input_file}")
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    products = data.get("products", [])
    categories = {c["id"]: c["name"] for c in data.get("categories", [])}

    print(f"Found {len(products)} products and {len(categories)} categories")

    # Load checkpoint
    processed_ids, enriched_products = load_checkpoint()
    print(f"Resuming from checkpoint: {len(processed_ids)} already processed")

    # Process each product
    total = len(products)
    for i, product in enumerate(products):
        product_id = product["id"]

        if product_id in processed_ids:
            continue

        product_name = product.get("name", "Unknown")[:50]
        print(f"[{i + 1}/{total}] Processing: {product_name}...")

        # Phase 1: Extract specs from _notes
        notes = product.get("_notes", "")
        specs = extract_specifications(notes)

        # Phase 2: AI enhancement
        category_name = categories.get(product.get("category_id"), "Acrílicos")
        prompt = PROMPT_TEMPLATE.format(
            name=product.get("name", ""),
            category=category_name,
            description=product.get("description", ""),
            notes=notes,
        )

        ai_content = call_openrouter(prompt)

        # Build enriched product
        enriched = {
            **product,  # Preserve all existing fields
            "resumo": ai_content.get("resumo", "") if ai_content else "",
            "descricao_completa": ai_content.get(
                "descricao_completa", product.get("description", "")
            )
            if ai_content
            else product.get("description", ""),
            "vantagens": ai_content.get("vantagens", "") if ai_content else "",
            "especificacoes_tecnicas": specs,
            "notas": notes,
        }

        # Log success/failure
        if ai_content:
            print(f"    ✓ AI content generated")
        else:
            print(f"    ✗ AI failed, using original description")

        enriched_products.append(enriched)
        processed_ids.append(product_id)

        # Checkpoint every 10
        if len(processed_ids) % 10 == 0:
            save_checkpoint(processed_ids, enriched_products)
            print(f"  ► Checkpoint saved: {len(processed_ids)} products")

        # Delay between calls to avoid rate limiting (free models need more time)
        time.sleep(5)

    # Final save
    save_checkpoint(processed_ids, enriched_products)

    # Build final output
    output_data = {
        "categories": data.get("categories", []),
        "products": enriched_products,
        "stats": {
            "total_products": len(enriched_products),
            "enriched_at": datetime.now().isoformat(),
        },
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n{'=' * 60}")
    print(f"COMPLETE!")
    print(f"{'=' * 60}")
    print(f"Total products processed: {len(enriched_products)}")
    print(f"Output saved to: {output_file}")


def main():
    """Entry point."""

    if not OPENROUTER_API_KEY:
        print("=" * 60)
        print("ERROR: OPENROUTER_API_KEY environment variable not set")
        print("=" * 60)
        print("\nSet it before running:")
        print("  Windows CMD:    set OPENROUTER_API_KEY=sk-or-v1-your-key")
        print("  PowerShell:     $env:OPENROUTER_API_KEY='sk-or-v1-your-key'")
        print("  Bash/Zsh:       export OPENROUTER_API_KEY=sk-or-v1-your-key")
        return

    print("=" * 60)
    print("JOCRIL PRODUCT ENRICHMENT")
    print("=" * 60)
    print(f"Input:  {INPUT_FILE}")
    print(f"Output: {OUTPUT_FILE}")
    print(f"Models: {len(MODELS)} in rotation")
    print("=" * 60)
    print()

    process_products(INPUT_FILE, OUTPUT_FILE)


if __name__ == "__main__":
    main()
