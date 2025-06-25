# Order Tracking Setup Guide

## Google Sheets Integration (Recommended)

This setup will automatically log all orders to a Google Sheet for easy tracking and management, working both locally and on Vercel/Render.com.

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API
4. **Important for Vercel**: Add your domain to authorized origins if needed

### Step 2: Create Service Account
1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Download the JSON credentials file
4. Note the service account email address
5. **Save the private key** - you'll need it for both local and production

### Step 3: Create Google Sheet
1. Create a new Google Sheet
2. Add headers in row 1: `Timestamp | Name | Phone | Address | Email | Referral Code | Items | Total | Status | Notes`
3. Share the sheet with your service account email (Editor access)
4. Copy the Spreadsheet ID from the URL (the long string between /d/ and /edit)

### Step 4: Local Development Setup
Create a `.env.local` file in your project root:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id-here
```

## Deployment Options

### Option A: Vercel Deployment (Recommended for Next.js)

#### A. Create Vercel Account
1. Go to [Vercel.com](https://vercel.com) and create an account
2. Connect your GitHub repository
3. **Advantage**: Vercel is created by the Next.js team - perfect optimization

#### B. Deploy to Vercel
1. Click "New Project"
2. Import your GitHub repository
3. Vercel will auto-detect it's a Next.js project
4. Configure settings:
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

#### C. Add Environment Variables
In your Vercel dashboard, go to your project > "Settings" > "Environment Variables" and add:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id-here
```

**Important**: For the private key on Vercel, make sure to include the quotes and escape the newlines properly.

#### D. Deploy
1. Vercel will automatically deploy when you push to your main branch
2. Your site will be available at `https://your-app-name.vercel.app`
3. **Custom domain**: You can add your own domain later

#### E. Vercel Advantages
- ✅ **Perfect Next.js Integration** - Built by the Next.js team
- ✅ **Automatic Optimizations** - Edge functions, image optimization
- ✅ **Global CDN** - Faster loading worldwide
- ✅ **Automatic HTTPS** - Security included
- ✅ **Preview Deployments** - Test changes before going live
- ✅ **Analytics** - Built-in performance monitoring
- ✅ **Free Tier** - Generous limits for small businesses

### Option B: Render.com Deployment

#### A. Create Render Account
1. Go to [Render.com](https://render.com) and create an account
2. Connect your GitHub repository

#### B. Create Web Service
1. Click "New +" > "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `loscos-pizzeria` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

#### C. Add Environment Variables
In your Render dashboard, go to your service > "Environment" tab and add:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id-here
```

#### D. Deploy
1. Render will automatically deploy when you push to your main branch
2. Your site will be available at `https://your-app-name.onrender.com`

## Testing Both Environments

### Local Testing:
```bash
npm run dev
# Visit http://localhost:3000
# Place a test order
# Check your Google Sheet
```

### Vercel Testing:
1. Push your code to GitHub
2. Wait for Vercel to deploy (usually 1-2 minutes)
3. Visit your Vercel URL
4. Place a test order
5. Check your Google Sheet

### Render Testing:
1. Push your code to GitHub
2. Wait for Render to deploy (usually 2-5 minutes)
3. Visit your Render URL
4. Place a test order
5. Check your Google Sheet

## Environment Comparison

| Feature | Vercel | Render |
|---------|--------|--------|
| **Next.js Optimization** | ✅ Perfect | ⚠️ Good |
| **Deployment Speed** | ✅ 1-2 minutes | ⚠️ 2-5 minutes |
| **Global CDN** | ✅ Yes | ❌ No |
| **Preview Deployments** | ✅ Yes | ❌ No |
| **Free Tier Limits** | ✅ Generous | ⚠️ Limited |
| **Custom Domains** | ✅ Easy | ✅ Easy |
| **SSL/HTTPS** | ✅ Automatic | ✅ Automatic |

## Troubleshooting

### Common Issues:

#### 1. "Failed to submit order" Error
- Check that all environment variables are set correctly
- Verify the service account has access to the Google Sheet
- Check the browser console for detailed error messages

#### 2. Google Sheets API Errors
- Ensure the Google Sheets API is enabled in your Google Cloud project
- Verify the service account email has Editor access to the sheet
- Check that the spreadsheet ID is correct

#### 3. Vercel Deployment Issues
- Check the build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify the framework is auto-detected as Next.js

#### 4. Render Deployment Issues
- Check the build logs in Render dashboard
- Ensure all environment variables are set
- Verify the start command is correct

#### 5. Private Key Format Issues
The private key should look like this in your environment variables:
```
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

## Alternative Options

### Option 2: Email Notifications
Use EmailJS to send order notifications to your email:

```bash
npm install @emailjs/browser
```

### Option 3: SMS Notifications
Use Twilio for SMS notifications:

```bash
npm install twilio
```

### Option 4: Simple Database
For more advanced tracking, consider:
- **Supabase** (PostgreSQL with real-time features)
- **PlanetScale** (MySQL with branching)
- **MongoDB Atlas** (NoSQL database)

## Admin Features You Can Add

1. **Order Status Updates** - Mark orders as "Preparing", "Ready", "Delivered"
2. **Customer Database** - Track repeat customers
3. **Analytics Dashboard** - Sales reports, popular items
4. **Inventory Tracking** - Monitor ingredient usage
5. **Delivery Tracking** - Real-time delivery status

## Current Implementation

The current setup will:
- ✅ Log all orders to Google Sheets (local, Vercel & Render)
- ✅ Include customer details and order items
- ✅ Track order timestamps
- ✅ Provide order status tracking
- ✅ Enable easy export to Excel/CSV
- ✅ Work seamlessly across all environments

**Recommendation**: Use Vercel for the best Next.js experience and performance! 