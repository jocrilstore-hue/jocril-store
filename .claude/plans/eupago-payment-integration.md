# Plan: EuPago Payment Integration

## Overview
Implement Multibanco and MB Way payments via EuPago API.

## Checklist

- [ ] Create EuPago client library (`lib/payments/eupago.ts`)
- [ ] Create Multibanco API route (`app/api/payment/multibanco/route.ts`)
- [ ] Create MB Way API route (`app/api/payment/mbway/route.ts`)
- [ ] Create webhook handler (`app/api/webhooks/eupago/route.ts`)
- [ ] Create order status endpoint (`app/api/orders/[orderNumber]/status/route.ts`)
- [ ] Update checkout page with payment method selection
- [ ] Create/update success page with payment details

## Files to Create

```
lib/payments/eupago.ts          # EuPago API client
app/api/payment/multibanco/route.ts
app/api/payment/mbway/route.ts
app/api/webhooks/eupago/route.ts
app/api/orders/[orderNumber]/status/route.ts
```

## Review

**Completed**

### Files Created

| File | Description |
|------|-------------|
| `lib/payments/eupago.ts` | EuPago API client with Multibanco + MB Way |
| `app/api/payment/multibanco/route.ts` | Generate Multibanco reference |
| `app/api/payment/mbway/route.ts` | Request MB Way payment |
| `app/api/webhooks/eupago/route.ts` | Handle EuPago payment callbacks |
| `app/api/orders/[orderNumber]/status/route.ts` | Poll order payment status |

### Files Modified

| File | Changes |
|------|---------|
| `app/(site)/checkout/page.tsx` | Added payment method selector (Multibanco/MB Way) |
| `app/(site)/checkout/sucesso/page.tsx` | Shows payment details, polls for MB Way confirmation |

### Environment Variables Required

```
EUPAGO_API_KEY=your-api-key
EUPAGO_BASE_URL=https://clientes.eupago.pt
NEXT_PUBLIC_SITE_URL=https://jocril-store.vercel.app
```

### Database Migration Required

Run in Supabase dashboard:
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS eupago_reference VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS eupago_entity VARCHAR(10);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS eupago_transaction_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/multibanco` | Generate Multibanco reference |
| POST | `/api/payment/mbway` | Request MB Way payment |
| POST | `/api/webhooks/eupago` | EuPago callback (payment confirmation) |
| GET | `/api/orders/[orderNumber]/status` | Check payment status |

### Checkout Flow

1. User fills checkout form
2. Selects payment method (Multibanco or MB Way)
3. Order created via POST `/api/orders`
4. Payment initiated via POST `/api/payment/[method]`
5. Redirected to success page with payment details
6. For MB Way: page polls for payment confirmation

### Testing

1. Add env vars to `.env.local`
2. Run migration in Supabase
3. Test checkout with Multibanco
4. Test checkout with MB Way
5. Simulate webhook with curl:
```bash
curl -X POST http://localhost:3000/api/webhooks/eupago \
  -H "Content-Type: application/json" \
  -d '{"identificador":"JCR-xxx","transacao":"TEST123","valor":123.45,"canal":"Multibanco","referencia":"123456789","data":"2024-12-20 14:30:00"}'
```
