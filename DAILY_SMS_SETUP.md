# Daily Order Summary SMS Setup

This feature sends you a daily text message at 10 AM with a summary of all orders for the day.

## What You'll Receive

The daily SMS includes:
- **Total number of orders**
- **Total revenue for the day**
- **Payment method breakdown** (cash vs card)
- **Detailed order list** with customer names, phone numbers, items, and order times

### Example Message:
```
📊 Daily Order Summary - Monday, January 15, 2024

🍕 Total Orders: 3
💰 Total Revenue: $65.00

💳 Payment Methods:
• Cash: 2 orders
• Card: 1 order

📋 Order Details:
1. John Doe - $25.00
   1x Yoshi's Weekly Special
   📞 (555) 123-4567
   ⏰ 2:30 PM

2. Jane Smith - $20.00
   1x Classic Margherita
   📞 (555) 987-6543
   ⏰ 4:45 PM

3. Mike Johnson - $20.00
   1x Classic Margherita
   📞 (555) 456-7890
   ⏰ 6:15 PM
```

## Prerequisites

This feature requires the same setup as your existing SMS notifications:

### Environment Variables Required:
```bash
# Twilio Configuration (already set up)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Business Phone (where daily summaries are sent)
BUSINESS_PHONE_NUMBER=your_business_phone_number

# Google Sheets Configuration (already set up)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY=your_private_key
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id

# Optional: Security for cron endpoint
CRON_SECRET=your_random_secret_key
```

## Automatic Scheduling (Recommended)

### Using Vercel Cron (Free)

1. **Deploy to Vercel** - The `vercel.json` file is already configured to run daily at 10 AM
2. **Automatic execution** - Vercel will automatically call the endpoint every day
3. **No setup required** - Just deploy and it works!

The cron runs at **10:00 AM UTC**. To adjust the time zone:
- **EST/EDT**: Use `0 14 * * *` (10 AM Eastern)
- **PST/PDT**: Use `0 17 * * *` (10 AM Pacific)
- **CST/CDT**: Use `0 15 * * *` (10 AM Central)

### Using GitHub Actions (Alternative)

If you prefer GitHub Actions, create `.github/workflows/daily-summary.yml`:

```yaml
name: Daily Order Summary
on:
  schedule:
    - cron: '0 14 * * *'  # 10 AM EST
  workflow_dispatch:  # Manual trigger

jobs:
  send-summary:
    runs-on: ubuntu-latest
    steps:
      - name: Send Daily Summary
        run: |
          curl -X GET "https://your-domain.vercel.app/api/cron/daily-summary" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Manual Testing

### Test the Daily Summary API
```bash
# Send today's summary
curl -X POST "https://your-domain.com/api/daily-summary" \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-01-15"}'

# Send summary for specific date
curl -X POST "https://your-domain.com/api/daily-summary" \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-01-15"}'
```

### Test the Cron Endpoint
```bash
# Trigger manual daily summary
curl -X GET "https://your-domain.com/api/cron/daily-summary"

# With authentication (if CRON_SECRET is set)
curl -X GET "https://your-domain.com/api/cron/daily-summary" \
  -H "Authorization: Bearer your_cron_secret"
```

## Message Handling

### No Orders Day
If there are no orders for the day, you'll receive:
```
📊 Daily Order Summary - Monday, January 15, 2024

🍕 No orders received today.

Have a great day! 🌟
```

### Long Messages
- Messages are automatically truncated if they exceed SMS limits
- Order details are shortened while preserving essential information
- All summary data (totals, counts) is always included

## Troubleshooting

### No SMS Received
1. **Check Vercel Cron Logs** - Go to Vercel Dashboard → Functions → Cron
2. **Verify Time Zone** - Ensure the cron schedule matches your desired time
3. **Test Environment Variables** - All Twilio and Google Sheets vars must be set
4. **Check Phone Number Format** - Must be valid US number format

### Wrong Time Zone
- Update the cron schedule in `vercel.json`
- Redeploy to Vercel for changes to take effect

### Missing Orders
- Verify orders are being saved to Google Sheets correctly
- Check that the pickup date format matches (YYYY-MM-DD)
- Test the API manually with a specific date

## Security

- The cron endpoint can optionally use `CRON_SECRET` for authentication
- All sensitive data (Twilio, Google credentials) are in environment variables
- SMS messages are sent only to the configured `BUSINESS_PHONE_NUMBER`

## Features

✅ **Automated daily summaries** at 10 AM  
✅ **Comprehensive order details** with customer info  
✅ **Revenue and payment tracking**  
✅ **Smart message truncation** for long order lists  
✅ **No-orders-day handling**  
✅ **Manual testing endpoints**  
✅ **Secure cron authentication**  
✅ **Multiple scheduling options** (Vercel, GitHub Actions)  

## Support

- Test manually using the API endpoints
- Check Vercel function logs for debugging
- Verify all environment variables are set correctly
- Ensure Google Sheets and Twilio integrations are working 