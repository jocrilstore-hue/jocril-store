# Plan: Transactional Email System with Resend

## Overview
Implement order emails using Resend with Jocril brand styling.

## Checklist

- [x] Install Resend package
- [x] Create email client (`lib/email/resend.ts`)
- [x] Create brand styles (`lib/email/templates/styles.ts`)
- [x] Create order confirmation template
- [x] Create payment received template
- [x] Create admin notification template
- [x] Create email service functions
- [x] Integrate into order creation flow
- [x] Integrate into payment webhook
- [x] Create email_logs table migration

## Review

**Completed**

### Files Created

| File | Description |
|------|-------------|
| `lib/email/resend.ts` | Resend client with sendEmail, sendAdminEmail, logging |
| `lib/email/templates/styles.ts` | Brand colors, fonts, inline CSS styles |
| `lib/email/templates/order-confirmation.ts` | Customer order confirmation with payment details |
| `lib/email/templates/payment-received.ts` | Payment success notification |
| `lib/email/templates/admin-notification.ts` | New order alert for admin |
| `lib/email/send-order-emails.ts` | Service functions: sendOrderConfirmation, sendPaymentReceived, sendAdminNotification |
| `supabase/migrations/20251220_create_email_logs.sql` | Email logging table |

### Files Modified

| File | Changes |
|------|---------|
| `app/api/orders/route.ts` | Added email sending after order creation |
| `app/api/webhooks/eupago/route.ts` | Added payment received email |

### Brand Styling Applied

- **Primary Accent (Teal):** #2DD4CD
- **Dashed borders** for cards (minimalist/technical)
- **Monospace labels** for metadata (uppercase, small)
- **Clean spacing** with generous whitespace
- **High contrast** for accessibility

### Email Templates

1. **Order Confirmation** (`order_confirmation`)
   - Sent to customer after checkout
   - Shows order number, items, totals
   - Prominently displays Multibanco payment details if applicable
   - MB Way message if applicable

2. **Payment Received** (`payment_received`)
   - Sent when EuPago webhook confirms payment
   - Shows payment success, amount, next steps
   - Estimated delivery info

3. **Admin Notification** (`admin_notification`)
   - Sent to geral@jocril.pt for every new order
   - Full order details, customer info, payment status
   - Dark header for admin-style appearance

### Environment Variables Required

```
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=onboarding@resend.dev
ADMIN_EMAIL=geral@jocril.pt
```

### Database Migration Required

Run in Supabase dashboard:
```sql
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    email_type VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    resend_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Email Flow

1. **Order Created** → `sendOrderConfirmation` + `sendAdminNotification`
2. **Payment Received (webhook)** → `sendPaymentReceived`
3. **Order Shipped (future)** → `sendOrderShipped` (placeholder)

### Error Handling

- Emails are sent asynchronously (don't block order creation)
- All failures are logged to `email_logs` table
- Errors are caught and logged, never fail the main flow

### Testing

1. Add env vars to `.env.local`
2. Run email_logs migration
3. Place a test order
4. Check Resend dashboard for sent emails
5. Check email_logs table for records
