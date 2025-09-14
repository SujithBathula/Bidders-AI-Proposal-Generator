# Subscription System Implementation

## Overview

This implementation adds a subscription-based system to the Bidders AI Proposal Generator with two tiers:

- **Base Plan**: $20/month + GST (5 AI proposals + 5 downloads)
- **Premium Plan**: $100/month + GST (20 AI proposals + 20 downloads)

## Features Implemented

### Backend Features

1. **Database Schema Updates**
   - `subscriptions` table for tracking user subscriptions
   - `usage_records` table for detailed usage tracking
   - Updated `proposals` table with download tracking

2. **Subscription Service**
   - Create subscriptions with Stripe integration
   - Check proposal generation and download eligibility
   - Record usage and enforce limits
   - Handle Stripe webhooks for subscription events

3. **API Endpoints**
   - `POST /api/subscriptions` - Create subscription
   - `GET /api/subscriptions` - Get subscription details
   - `GET /api/subscriptions/analytics` - Usage analytics
   - `GET /api/subscriptions/eligibility/proposals` - Check proposal eligibility
   - `GET /api/subscriptions/eligibility/downloads` - Check download eligibility
   - `DELETE /api/subscriptions` - Cancel subscription
   - `POST /api/proposals/:id/download` - Download with subscription check

### Frontend Features

1. **Updated Subscription Plans Component**
   - Shows new pricing with GST calculation
   - Two-tier plan structure
   - Clear feature comparison

2. **Subscription Status Component**
   - Real-time usage tracking
   - Progress bars for proposals and downloads
   - Usage warnings when approaching limits
   - Billing period information

3. **Download Protection**
   - Checks subscription limits before allowing downloads
   - Prompts for upgrade when limits exceeded
   - Progress tracking for downloads

4. **Updated Checkout**
   - GST calculation (10%)
   - Stripe integration for subscriptions
   - Proper pricing display

## Setup Instructions

### 1. Database Migration

Run the migration to create subscription tables:

```sql
-- Run the migration file: 002_add_subscription_tables.sql
```

### 2. Environment Variables

Update your `.env` file with Stripe configuration:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_BASE_PRICE_ID=price_your_base_plan_id
STRIPE_PREMIUM_PRICE_ID=price_your_premium_plan_id
```

### 3. Stripe Setup

1. Create Stripe products and prices:
   - Base Plan: $22 USD/month (includes GST)
   - Premium Plan: $110 USD/month (includes GST)

2. Set up webhook endpoint: `/api/subscriptions/webhook`

3. Configure webhook events:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`

### 4. Frontend Configuration

Update Stripe publishable key in the frontend:

```javascript
// Update the Stripe key in CheckoutPage.js and other components
const stripePromise = loadStripe("pk_test_your_publishable_key");
```

## Usage Flow

### 1. Subscription Creation

1. User selects a plan
2. Proceeds to checkout with billing information
3. Payment processed through Stripe
4. Subscription created in database
5. Usage tracking begins

### 2. Proposal Generation

1. Check subscription eligibility
2. If eligible, generate proposal and record usage
3. If not eligible, prompt for subscription upgrade
4. Update usage counters

### 3. Proposal Download

1. Check download eligibility
2. If eligible, allow download and record usage
3. If not eligible, show upgrade prompt
4. Update download counters

### 4. Usage Tracking

- Real-time usage monitoring
- Monthly limits enforcement
- Automatic reset on billing cycle
- Detailed usage analytics

## API Documentation

### Subscription Endpoints

#### Create Subscription
```http
POST /api/subscriptions
Content-Type: application/json
Authorization: Bearer <token>

{
  "planType": "BASE|PREMIUM",
  "paymentMethodId": "pm_stripe_payment_method_id",
  "customerEmail": "user@example.com"
}
```

#### Get Subscription
```http
GET /api/subscriptions
Authorization: Bearer <token>
```

#### Check Eligibility
```http
GET /api/subscriptions/eligibility/proposals
GET /api/subscriptions/eligibility/downloads
Authorization: Bearer <token>
```

#### Download Proposal
```http
POST /api/proposals/{id}/download
Authorization: Bearer <token>
```

## Error Handling

The system handles various error scenarios:

- **No Subscription**: Prompts user to subscribe
- **Limit Reached**: Shows usage limits and upgrade options
- **Payment Failed**: Handles failed payments via webhooks
- **Network Errors**: Graceful error handling with user feedback

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Users can only access their own subscriptions
3. **Webhook Security**: Stripe webhook signature verification
4. **Rate Limiting**: Prevents abuse of API endpoints
5. **Input Validation**: All inputs validated and sanitized

## Testing

### Unit Tests
- Subscription service methods
- Controller endpoints
- Frontend components

### Integration Tests
- Stripe webhook handling
- Database operations
- API endpoint flows

### Manual Testing
1. Create subscription with test card
2. Generate proposals up to limit
3. Attempt generation after limit
4. Download proposals up to limit
5. Attempt download after limit
6. Webhook event handling

## Production Deployment

### Before Going Live

1. **Update Stripe Keys**: Replace test keys with live keys
2. **Database Migration**: Run on production database
3. **Webhook Configuration**: Update webhook URL for production
4. **Environment Variables**: Set all production environment variables
5. **SSL Certificate**: Ensure HTTPS for webhook endpoints
6. **Monitoring**: Set up logging and monitoring for subscription events

### Monitoring

Track these metrics:
- Subscription creation/cancellation rates
- Usage patterns (proposals vs downloads)
- Payment success/failure rates
- API endpoint performance
- Webhook delivery success

## Support and Maintenance

### Regular Tasks
- Monitor subscription health
- Review usage analytics
- Handle customer billing inquiries
- Update pricing as needed
- Manage Stripe webhook failures

### Common Issues
- Failed webhook deliveries
- Payment method updates
- Subscription downgrades/upgrades
- Usage limit adjustments
- Billing cycle questions

## Future Enhancements

1. **Annual Billing**: Add annual billing with discounts
2. **Team Plans**: Multi-user subscriptions
3. **Usage Rollover**: Allow unused credits to roll over
4. **Custom Plans**: Enterprise-level custom pricing
5. **Analytics Dashboard**: Detailed usage and billing analytics
6. **Mobile App**: Extend subscription management to mobile
