# SMS Notifications Setup Guide

This guide will help you set up text message notifications for new orders using Twilio.

## 🚀 Quick Setup

### 1. Create a Twilio Account
1. Go to [twilio.com](https://www.twilio.com) and sign up for a free account
2. Verify your email and phone number
3. You'll get $15-20 in free credits to start

### 2. Get Your Twilio Credentials
1. In your Twilio Console, find your **Account SID** and **Auth Token**
2. Go to Phone Numbers → Manage → Buy a number
3. Purchase a phone number (about $1/month) for sending SMS

### 3. Set Environment Variables

Add these to your `.env.local` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
BUSINESS_PHONE_NUMBER=+1234567890

# Your website URL (for production)
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### 4. Test the Setup
1. Place a test order on your website
2. You should receive a text message with order details
3. Check the console logs for any errors

## 📱 What You'll Receive

When someone places an order, you'll get a text message like this:

```
🍕 NEW ORDER RECEIVED!

Customer: John Doe
Phone: (555) 123-4567
Email: john@example.com
Pickup Date: 2024-01-15

Order: 1x Margherita Pizza, 1x Pepperoni Pizza
Total: $32.00

Special Requests: Extra cheese please

Referral Code: FRIEND2024
```

## 💰 Cost Breakdown

- **Twilio Account**: Free
- **Phone Number**: ~$1/month
- **SMS Cost**: ~$0.0075 per message (US numbers)
- **Estimated Monthly Cost**: $1 + (orders × $0.0075)

For 100 orders/month: ~$1.75 total

## 🔧 Advanced Configuration

### Customize the Message Format
Edit `src/app/api/notifications/sms/route.ts` to change the message format.

### Add Multiple Recipients
You can send to multiple phone numbers by modifying the SMS route.

### International Numbers
Twilio supports international SMS (different rates apply).

## 🚨 Troubleshooting

### Common Issues:

1. **"SMS service not configured"**
   - Check that all environment variables are set
   - Verify Twilio credentials are correct

2. **"Failed to send SMS"**
   - Check Twilio account balance
   - Verify phone number format (+1XXXXXXXXXX)
   - Check Twilio console for error details

3. **No SMS received**
   - Check spam folder
   - Verify phone number is correct
   - Check Twilio logs in console

### Debug Steps:
1. Check browser console for errors
2. Check server logs in terminal
3. Check Twilio console for message status
4. Verify environment variables are loaded

## 📈 Next Steps

Once SMS notifications are working, consider adding:

1. **Customer SMS notifications** (order ready, pickup reminders)
2. **Daily order summaries**
3. **Low inventory alerts**
4. **Marketing SMS campaigns**

## 🔒 Security Notes

- Never commit your Twilio credentials to git
- Use environment variables for all sensitive data
- Consider rate limiting for SMS API
- Monitor SMS usage to prevent abuse

## 📞 Support

If you need help:
1. Check Twilio documentation
2. Review server logs
3. Test with Twilio's trial account first
4. Contact support if issues persist 