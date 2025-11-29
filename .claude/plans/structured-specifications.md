# Structured Product Specifications

## Current Problem
- `specifications_text` is free-form HTML/text
- Parsing is unreliable
- No consistent structure across products

## Solution: Add `specifications_json` column

### Database Schema

```sql
-- Add new JSONB column to product_templates
ALTER TABLE product_templates 
ADD COLUMN specifications_json JSONB DEFAULT NULL;
```

### JSON Structure

```typescript
interface ProductSpecifications {
  // Required product dimensions
  produto: {
    largura_mm: number | null;
    altura_mm: number | null;
    profundidade_mm: number | null;
  };
  // Required graphic area
  area_grafica: {
    largura_mm: number | null;
    altura_mm: number | null;
    formato: string | null;        // e.g., "A6", "A5", "A4"
    impressao: "frente" | "verso" | "frente_verso" | null;
    num_cores: number | null;
  };
  // Optional notes
  notas: string | null;
  // Custom fields (flexible)
  extras: Array<{
    label: string;
    value: string;
  }>;
}
```

### Implementation Steps

1. [x] Design schema (this document)
2. [ ] Create migration for `specifications_json`
3. [ ] Update types.ts with interface
4. [ ] Create SpecificationsEditor component for admin
5. [ ] Update product-template-form.tsx to use new editor
6. [ ] Update product-detail.tsx to render structured specs
7. [ ] (Optional) Migration script to parse existing text into JSON

## Admin Form Design

```
┌─────────────────────────────────────────────────────────────────┐
│  ESPECIFICAÇÕES TÉCNICAS                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PRODUTO                                                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Largura (mm)    │ │ Altura (mm)     │ │ Profundidade    │   │
│  │ [    119     ]  │ │ [    132     ]  │ │ [     40     ]  │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                 │
│  ÁREA GRÁFICA                                                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Largura (mm)    │ │ Altura (mm)     │ │ Formato         │   │
│  │ [    105     ]  │ │ [    148     ]  │ │ [   A6   ▼]     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐   │
│  │ Impressão                   │ │ Nº de cores             │   │
│  │ [  Frente e verso  ▼]       │ │ [    4     ]            │   │
│  └─────────────────────────────┘ └─────────────────────────┘   │
│                                                                 │
│  NOTAS                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [                                                      ] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  CARACTERÍSTICAS ADICIONAIS                                     │
│  ┌──────────────────────┐ ┌────────────────────────────────┐   │
│  │ Label               │ │ Valor                          │   │
│  │ [  Peso           ] │ │ [  250g                      ] │ ✕ │
│  └──────────────────────┘ └────────────────────────────────┘   │
│  [+ Adicionar característica]                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Display

The product-detail.tsx will render:

```
┌─────────────────────────────────────────────────────────────────┐
│  PRODUTO                                                        │
│  Largura ─────────────────────────────────────────── 119mm     │
│  Altura ──────────────────────────────────────────── 132mm     │
│  Profundidade ────────────────────────────────────── 40mm      │
├─────────────────────────────────────────────────────────────────┤
│  ÁREA GRÁFICA                                                   │
│  Largura ─────────────────────────────────────────── 105mm     │
│  Altura ──────────────────────────────────────────── 148mm     │
│  Formato ────────────────────────────────────────────── A6     │
│  Impressão ─────────────────────────────── Frente e verso     │
├─────────────────────────────────────────────────────────────────┤
│  NOTAS                                                          │
│  "Material acrílico de 3mm de espessura"                       │
└─────────────────────────────────────────────────────────────────┘
```
