# Square Payment Integration Setup

This document outlines how to set up Square payment processing for the pizza ordering system.

## Prerequisites

1. A Square Developer account
2. A Square application (Sandbox and Production)

## Getting Started

### 1. Create a Square Developer Account

1. Go to [Square Developer Dashboard](https://developer.squareup.com/)
2. Sign up or log in with your Square account
3. Create a new application

### 2. Get Square Credentials

#### Sandbox Credentials (for development/testing)
1. In your Square Developer Dashboard, go to your application
2. Navigate to "Sandbox" in the left sidebar
3. Copy the following credentials:
   - **Application ID** (starts with `sandbox-sq0idb-`)
   - **Access Token** (starts with `EAAAl...`)

#### Production Credentials (for live payments)
1. In your Square Developer Dashboard, go to your application
2. Navigate to "Production" in the left sidebar  
3. Copy the following credentials:
   - **Application ID** (starts with `sq0idp-`)
   - **Access Token** (starts with `EAAAl...`)

### 3. Configure Environment Variables

Add the following environment variables to your `.env.local` file:

#### For Sandbox (Development)
```bash
# Square Payment Settings - Sandbox (3 variables)
SQUARE_ENVIRONMENT=sandbox
SQUARE_ACCESS_TOKEN=your_sandbox_access_token_here
NEXT_PUBLIC_SQUARE_APPLICATION_ID=your_sandbox_application_id_here
```

#### For Production (Live)
```bash
# Square Payment Settings - Production (4 variables)
SQUARE_ENVIRONMENT=production
SQUARE_ACCESS_TOKEN=your_production_access_token_here
NEXT_PUBLIC_SQUARE_APPLICATION_ID=your_production_application_id_here
NEXT_PUBLIC_SQUARE_LOCATION_ID=your_production_location_id_here
```

### Finding Your Location ID

1. In your Square Developer Dashboard, go to your application
2. Navigate to either "Sandbox" or "Production" 
3. Click on "Locations" in the left sidebar
4. Copy the Location ID for your business location

**Note**: Each environment (sandbox/production) has different location IDs.

**Important:** 
- Keep your access tokens secure and never commit them to version control
- The `NEXT_PUBLIC_SQUARE_APPLICATION_ID` is safe to expose to the client side
- Use sandbox credentials for development and testing
- Switch to production credentials only when ready to go live

### 4. Testing Card Numbers

For sandbox testing, use these test card numbers:

- **Visa**: `4111111111111111`
- **Mastercard**: `5555555555554444`
- **American Express**: `378282246310005`
- **Discover**: `6011111111111117`

**CVV**: Any 3-digit number  
**Expiration**: Any future date  
**ZIP Code**: Any 5-digit number

### 5. Production Deployment

Before going live:

1. Switch environment variables to production values (see production example above)
2. Get your production location ID from Square Dashboard
3. Test thoroughly in sandbox first
4. Ensure SSL/HTTPS is enabled on your domain

**How Environment Detection Works:**
- **Backend**: Uses the `SQUARE_ENVIRONMENT` variable to determine API endpoints and location
- **Frontend**: Auto-detects from Application ID prefix (`sandbox-` = sandbox, `sq0idp-` = production)
- This hybrid approach ensures proper environment separation while maintaining simplicity

### 6. Security Considerations

- Access tokens should be stored securely as environment variables
- Never expose access tokens in client-side code
- Use HTTPS in production
- Validate all payment responses server-side
- Monitor transaction logs in Square Dashboard

## Features Implemented

✅ Payment method selection (Cash vs Credit Card)  
✅ Square Web SDK integration for secure card input  
✅ Server-side payment processing with Square Payments API  
✅ Payment confirmation and order tracking  
✅ Error handling for failed payments  
✅ Sandbox testing support  

## API Endpoints

- `POST /api/payment` - Processes credit card payments through Square
- `POST /api/orders` - Creates orders with payment information

## Support

For Square-specific issues:
- [Square Developer Documentation](https://developer.squareup.com/docs)
- [Square Developer Forums](https://developer.squareup.com/forums)
- [Square Developer Support](https://developer.squareup.com/support) 