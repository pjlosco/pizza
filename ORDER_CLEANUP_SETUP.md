# Order Cleanup Setup Guide

This guide explains how to set up automated cleanup of old orders from your Google Sheet.

## 🧹 What It Does

The order cleanup cron job automatically removes orders that are more than 2 days past their pickup date from your Google Sheet. This helps keep your spreadsheet organized and removes completed orders.

## ⚙️ How It Works

- **Trigger**: Runs once daily via cron job
- **Cutoff**: Removes orders older than 2 days from today
- **Safety**: Only deletes orders, never touches the header row
- **Logging**: Provides detailed logs of what was deleted

## 🔧 Setup Instructions

### 1. Environment Variables

Make sure you have these environment variables set (you should already have them):

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
CRON_SECRET=your-secret-key-here
```

### 2. Vercel Cron Job Setup

Add this to your `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-orders",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- `0 2 * * *` = Run at 2:00 AM every day
- You can adjust the time as needed
- Format: `minute hour day month day-of-week`

### 3. Alternative: Manual Testing

You can test the cleanup manually by calling:

```bash
# Test locally
curl -X POST http://localhost:3000/api/cron/cleanup-orders

# Test in production (with auth)
curl -X POST https://yourdomain.com/api/cron/cleanup-orders \
  -H "Authorization: Bearer your-cron-secret"
```

## 📊 What Gets Cleaned Up

### Orders That Will Be Deleted:
- Orders with pickup dates more than 2 days ago
- Example: If today is July 2nd, orders from June 30th and earlier will be deleted

### Orders That Will Be Kept:
- Recent orders (within 2 days)
- Orders for today and future dates
- Header row (always preserved)
- Invalid/malformed rows (preserved for safety)

## 🔒 Security Features

- **Authentication**: Requires `CRON_SECRET` environment variable
- **Authorization Header**: Must include `Bearer your-secret`
- **Safe Deletion**: Only deletes order rows, never headers
- **Error Handling**: Continues processing even if individual deletions fail

## 📝 Logging

The cleanup job provides detailed logs:

```
Running scheduled order cleanup...
Cleaning up orders older than: 2025-06-30
Marking order for deletion: 2025-06-29 - John Doe ((555) 123-4567)
Found 3 orders to delete
Deleted row 15
Deleted row 12
Deleted row 8
Order cleanup completed successfully
```

## ⚠️ Important Notes

1. **Backup**: Consider backing up your Google Sheet before first run
2. **Testing**: Test manually first to ensure it works as expected
3. **Monitoring**: Check logs after first few runs to verify behavior
4. **Adjustment**: You can modify the 2-day cutoff in the code if needed

## 🛠️ Customization

### Change Cleanup Period

To change from 2 days to a different period, edit this line in `src/app/api/cron/cleanup-orders/route.ts`:

```typescript
// Change from 2 to your desired number of days
cutoffDate.setDate(cutoffDate.getDate() - 2);
```

### Change Schedule

To run more or less frequently, modify the cron schedule in `vercel.json`:

```json
// Run every 6 hours
"schedule": "0 */6 * * *"

// Run every Monday at 3 AM
"schedule": "0 3 * * 1"

// Run twice daily (2 AM and 2 PM)
"schedule": "0 2,14 * * *"
```

## 🚨 Troubleshooting

### Common Issues:

1. **"Unauthorized" Error**
   - Check that `CRON_SECRET` is set correctly
   - Verify the Authorization header format

2. **"Server configuration error"**
   - Ensure all Google Sheets environment variables are set
   - Check that the service account has proper permissions

3. **No orders deleted**
   - This is normal if all orders are recent
   - Check the cutoff date in the logs

4. **Partial deletion**
   - Some rows may fail to delete due to Google Sheets API limits
   - Check logs for specific error messages

### Debug Steps:
1. Check Vercel function logs
2. Test manually with curl
3. Verify environment variables
4. Check Google Sheets permissions

## 📈 Benefits

- **Cleaner Spreadsheet**: Removes clutter from old orders
- **Better Performance**: Smaller spreadsheet loads faster
- **Easier Management**: Focus on recent orders only
- **Automated**: No manual cleanup needed
- **Safe**: Preserves important data and headers

## 🔄 Future Enhancement: Order Archiving

**TODO: After production testing phase (Q1 2025)**

Instead of deleting old orders, we should implement an archiving system:

### Proposed Archiving System:
1. **Create Archive Sheet**: Add a second sheet to the Google Spreadsheet for archived orders
2. **Move Instead of Delete**: Transfer old orders to archive sheet instead of deleting
3. **Data Preservation**: Keep all order history for analytics and customer service
4. **Archive Format**: Maintain same structure as main sheet for consistency
5. **Archive Date**: Add timestamp of when order was archived

### Benefits of Archiving:
- 📊 **Analytics**: Historical data for business insights
- 🎯 **Customer Service**: Ability to look up past orders
- 📈 **Trends**: Track order patterns over time
- 🔍 **Audit Trail**: Complete order history maintained
- 📋 **Compliance**: Better for business record keeping

### Implementation Notes:
- Archive orders older than 30 days (instead of 2 days)
- Keep main sheet focused on recent/active orders
- Archive sheet for historical data and analysis
- Consider adding archive date column to track when orders were moved 