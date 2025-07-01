# Testing Guide for Square Payment Integration

Follow these steps to test the payment functionality in your pizza ordering system.

## Quick Test Steps

### 1. Open the Application
- Go to http://localhost:3000 in your browser
- Open Chrome DevTools (F12) and go to the Console tab

### 2. Add Items to Cart
- Click "Add to Order" on either pizza
- Click the "Cart" button to see your order
- Click "Checkout" to proceed to the order form

### 3. Fill Out Customer Information
- Fill in all required fields:
  - Name: Any name
  - Phone: (555) 123-4567
  - Email: test@example.com
  - Referral Code: TEST123
  - Pickup Date: Any future date (not Sunday)

### 4. Test Payment Method Selection

#### Testing Cash Payment:
- Select "💵 Cash on pickup" (should be selected by default)
- This should work without any additional setup
- Click "Place Order" to test the complete flow

#### Testing Credit Card Payment:
- Select "💳 Credit/Debit Card"
- Watch the Console for debugging messages

**Expected behavior:**
- You should see console messages like:
  - "Attempting to load Square SDK..."
  - "Square SDK loaded successfully"
  - "Initializing Square payment form..."

**If you see warnings about missing credentials:**
- This is expected in demo mode
- The form will show "Payment form setup required"
- You can still test the full flow with cash payments

## Setting Up Real Square Credentials (Optional)

If you want to test real card payments:

### 1. Create Square Developer Account
- Go to https://developer.squareup.com/
- Sign up and create a new application

### 2. Get Sandbox Credentials
- In your Square app, go to "Sandbox"
- Copy your Application ID (starts with `sandbox-sq0idb-`)
- Copy your Access Token (starts with `EAAAl...`)

### 3. Create Environment File
Create a file called `.env.local` in your project root:

```bash
# Square Payment Settings
SQUARE_ENVIRONMENT=sandbox
SQUARE_ACCESS_TOKEN=your_sandbox_access_token_here
NEXT_PUBLIC_SQUARE_APPLICATION_ID=your_sandbox_application_id_here
```

### 4. Restart the Server
```bash
npm run dev
```

### 5. Test with Real Square Form
- Now the credit card form should load properly
- Use test card: 4111111111111111
- Any future expiration date
- Any 3-digit CVV
- Any ZIP code

## Console Messages to Look For

### Successful Square SDK Loading:
```
Attempting to load Square SDK...
Square not found, loading script...
Square SDK loaded successfully
```

### Payment Form Initialization:
```
Initializing Square payment form...
Square Application ID: [your-app-id or undefined in demo mode]
Square payments instance created: [object]
Square card instance created: [object]
Square card attached to container
Square payment form initialized successfully
```

### Demo Mode (No Credentials):
```
Using demo mode - Square payments will not actually work until you add your real NEXT_PUBLIC_SQUARE_APPLICATION_ID
See SQUARE_PAYMENT_SETUP.md for setup instructions
```

## Expected Results

### Cash Payment:
✅ Order form completes successfully  
✅ Order is saved to Google Sheets  
✅ SMS notification is sent (if configured)  
✅ Confirmation shows "Pay with cash upon pickup"  

### Card Payment (Demo Mode):
✅ Payment form shows setup message  
✅ Order can still be completed by switching back to cash  

### Card Payment (With Credentials):
✅ Square card form loads in the gray box  
✅ Can enter test card information  
✅ Payment processes successfully  
✅ Confirmation shows "Payment Successful!"  

## Troubleshooting

### Payment Form Not Loading:
1. Check console for errors
2. Verify internet connection (Square SDK loads from CDN)
3. Make sure you're on http://localhost:3000 (not other ports)

### Square Credentials Issues:
1. Double-check your Application ID starts with `sandbox-sq0idb-`
2. Ensure Access Token starts with `EAAAl`
3. Restart the server after adding environment variables
4. Check that `.env.local` is in the project root

### Order Submission Issues:
1. Make sure Google Sheets integration is still working
2. Check all required fields are filled
3. Verify pickup date is not on Sunday

## Next Steps

Once testing is complete:
- For production: Switch to production Square credentials
- Update the Square SDK URL to production version
- Ensure HTTPS is enabled for production deployment

Happy testing! 🍕💳 