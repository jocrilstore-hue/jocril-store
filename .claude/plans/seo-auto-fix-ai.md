# SEO Auto-Fix with AI - Implementation Plan

## Date: 2025-11-30
## Status: COMPLETED

## Summary

Add AI-powered SEO auto-fix capabilities to the existing Ferramentas page (`/admin/products/tools`). The feature will use OpenRouter API to access high-quality AI models for generating SEO content (titles, alt text, meta descriptions).

## Research Findings: Best Model Choice

Based on research, here are the top options via **OpenRouter**:

| Model | Quality | Input Cost | Output Cost | Vision | Best For |
|-------|---------|------------|-------------|--------|----------|
| **Claude Sonnet 4** | Excellent | $3/1M | $15/1M | No | Content quality, natural writing |
| **Gemini 2.5 Pro** | Excellent | $1.25/1M | $10/1M | Yes (images) | Multimodal, image analysis |
| **Gemini 2.5 Flash** | Good | $0.10/1M | $0.40/1M | Yes | Budget-friendly with vision |
| GPT-4o | Good | $2.50/1M | $10/1M | Yes | General purpose |

### Recommendation: **Gemini 2.5 Pro** via OpenRouter

**Why:**
1. **Vision capability** - Can analyze product images to generate accurate alt text
2. **Cost effective** - ~$1.25/1M input tokens (cheaper than Claude for text)
3. **Quality** - Google's flagship model with excellent reasoning
4. **For 150 products**: Estimated cost < $1 total for full SEO audit + fixes

**Alternative for text-only tasks**: Claude Sonnet 4 for superior writing quality

## Implementation Checklist

- [x] Create `admin_settings` table migration
- [x] Create `/api/admin/settings` route (GET/POST)
- [x] Create `/api/admin/settings/test` route (POST) - test connection
- [x] Create `/api/admin/seo/scan` route (GET)
- [x] Create `/api/admin/seo/auto-fix` route (POST)
- [x] Create `/api/admin/seo/apply` route (POST)
- [x] Create `lib/openrouter.ts` utility
- [x] Add AI Settings section to ProductToolsDashboard
- [x] Implement real SEO scan logic
- [x] Add preview modal component (SEOAutoFixModal)
- [x] Add "Auto-Corrigir com IA" button with flow
- [x] Database migration applied to production

## Files Created/Modified

### New Files
- `supabase/migrations/20250130_create_admin_settings.sql` - Database migration
- `app/api/admin/settings/route.ts` - Settings API (GET/POST)
- `app/api/admin/settings/test/route.ts` - Test connection API
- `app/api/admin/seo/scan/route.ts` - SEO scan API
- `app/api/admin/seo/auto-fix/route.ts` - AI generation API
- `app/api/admin/seo/apply/route.ts` - Apply fixes API
- `lib/openrouter.ts` - OpenRouter API utility
- `components/admin/products/seo-auto-fix-modal.tsx` - Preview modal

### Modified Files
- `components/admin/products/product-tools-dashboard.tsx` - Added AI settings section and real SEO scan

## How It Works

### User Flow
1. Admin goes to `/admin/products/tools`
2. Enters OpenRouter API key in "Configuracoes IA" section
3. Selects preferred model (Gemini 2.5 Pro recommended)
4. Clicks "Guardar" then "Testar Conexao" to verify
5. Clicks "Executar checklist" to scan for SEO issues
6. Sees results: missing meta descriptions, duplicate titles, missing alt text
7. Clicks "Corrigir" on specific issue type or "Auto-Corrigir Tudo"
8. Modal shows AI-generated suggestions with preview
9. Admin reviews, selects/deselects fixes, clicks "Aplicar"
10. Fixes saved to database, can re-scan to verify

### AI Generation
- **Meta descriptions**: Generated from product name, category, material, description
- **Unique titles**: Generated avoiding existing duplicates
- **Alt text**: Uses vision models to analyze actual product images (Gemini 2.5 Pro)

## Cost Estimate (150 products)

**Gemini 2.5 Pro:**
- Input: 150 x 500 x 3 = 225,000 tokens = $0.28
- Output: 150 x 100 x 3 = 45,000 tokens = $0.45
- **Total: ~$0.73** for complete SEO audit + fixes

## Security

1. API key stored in Supabase `admin_settings` table with RLS
2. API key masked in UI after saving (shows `sk-or-v1-...xxxx`)
3. All API calls server-side only (never exposed to client)
4. Admin authentication required for all endpoints

## Review Notes

- Build passes with no TypeScript errors
- Migration applied to production Supabase
- All 4 AI models available: Gemini 2.5 Pro, Gemini 2.5 Flash, Claude Sonnet 4, GPT-4o
- Vision capability for alt text generation with compatible models
- Portuguese (Portugal) language for all generated content
