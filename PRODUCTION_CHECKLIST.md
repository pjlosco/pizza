# Production Deployment Checklist

## Current Issue
You're getting this error: `ApplicationIdEnvironmentMismatchError: Web Payments SDK was initialized with an application ID created in production however you are currently using sandbox.`

This means you have a **production Application ID** but some settings are still configured for sandbox.

## Required Environment Variables for Production

Set these in your production environment (Vercel, Netlify, etc.):

```bash
SQUARE_ENVIRONMENT=production
SQUARE_ACCESS_TOKEN=your_production_access_token
NEXT_PUBLIC_SQUARE_APPLICATION_ID=your_production_application_id
NEXT_PUBLIC_SQUARE_LOCATION_ID=your_production_location_id
```

## How to Get Your Production Location ID

1. Go to [Square Developer Dashboard](https://developer.squareup.com/)
2. Navigate to your application
3. Click on "Production" in the left sidebar
4. Click on "Locations"
5. Copy the Location ID (it will be different from your sandbox Location ID)

## Environment Variable Check

To verify your current environment variables are set correctly:

1. **SQUARE_ENVIRONMENT should be `production`** (not `sandbox`)
2. **Application ID should start with `sq0idp-`** (not `sandbox-`)
3. **Access Token should be your production token** (not sandbox)
4. **Location ID should be your production location** (not `L8SFFEWCCGKF3`)

## Testing Your Setup

After updating your environment variables:

1. Deploy your changes
2. Visit your production site
3. Try to add items to cart and proceed to checkout
4. Select "Credit/Debit Card" payment method
5. The Square payment form should load without errors

## If You Still Get Errors

1. Check your deployment platform's environment variable configuration
2. Ensure all 4 environment variables are set correctly
3. Verify the Application ID starts with `sq0idp-` (production) not `sandbox-`
4. Make sure you're using the production Location ID, not the sandbox one

## Environment-Based Configuration

The code uses:
- **SQUARE_ENVIRONMENT** (backend): Determines API endpoints and location ID for payment processing
- **Application ID prefix** (frontend): Auto-detects sandbox vs production to load correct SDK
- **NEXT_PUBLIC_SQUARE_LOCATION_ID** (frontend): Required for production Square SDK initialization

This keeps it simple with minimal environment variables while maintaining proper environment separation. 