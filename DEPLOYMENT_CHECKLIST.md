# Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Ready
- [ ] All features working locally
- [ ] No console errors
- [ ] Order submission tested
- [ ] Phone validation working
- [ ] Cart functionality working

### ✅ Google Sheets Setup
- [ ] Google Cloud project created
- [ ] Google Sheets API enabled
- [ ] Service account created
- [ ] Service account credentials downloaded
- [ ] Google Sheet created with proper headers
- [ ] Sheet shared with service account email
- [ ] Spreadsheet ID copied

### ✅ SMS Notifications Setup (Optional)
- [ ] Twilio account created
- [ ] Twilio phone number purchased
- [ ] Account SID and Auth Token copied
- [ ] SMS notifications tested locally
- [ ] Environment variables configured

### ✅ Environment Variables (Local)
- [ ] `.env.local` file created
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL` set
- [ ] `GOOGLE_PRIVATE_KEY` set (with proper formatting)
- [ ] `GOOGLE_SPREADSHEET_ID` set
- [ ] `TWILIO_ACCOUNT_SID` set (if using SMS)
- [ ] `TWILIO_AUTH_TOKEN` set (if using SMS)
- [ ] `TWILIO_PHONE_NUMBER` set (if using SMS)
- [ ] `BUSINESS_PHONE_NUMBER` set (if using SMS)
- [ ] Local testing successful

### ✅ GitHub Repository
- [ ] Code pushed to GitHub
- [ ] Repository is public (for free plans)
- [ ] Main branch is up to date

## Deployment Options

### Option A: Vercel Deployment (Recommended)

#### ✅ Vercel Account Setup
- [ ] Vercel account created
- [ ] GitHub connected to Vercel
- [ ] Repository selected

#### ✅ Project Configuration
- [ ] Project name: `loscos-pizzeria` (or preferred name)
- [ ] Framework: Next.js (auto-detected)
- [ ] Build Command: `npm run build` (auto-detected)
- [ ] Output Directory: `.next` (auto-detected)
- [ ] Install Command: `npm install` (auto-detected)

#### ✅ Environment Variables (Vercel)
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL` added
- [ ] `GOOGLE_PRIVATE_KEY` added (with quotes and \n)
- [ ] `GOOGLE_SPREADSHEET_ID` added
- [ ] `TWILIO_ACCOUNT_SID` added (if using SMS)
- [ ] `TWILIO_AUTH_TOKEN` added (if using SMS)
- [ ] `TWILIO_PHONE_NUMBER` added (if using SMS)
- [ ] `BUSINESS_PHONE_NUMBER` added (if using SMS)
- [ ] All variables saved

#### ✅ Deployment
- [ ] Initial deployment successful
- [ ] Build logs show no errors
- [ ] Site accessible at Vercel URL
- [ ] Order submission tested on live site
- [ ] Google Sheet receiving orders

#### ✅ Vercel Advantages
- [ ] Perfect Next.js optimization
- [ ] Global CDN for faster loading
- [ ] Automatic HTTPS
- [ ] Preview deployments available
- [ ] Built-in analytics

### Option B: Render.com Deployment

#### ✅ Render Account Setup
- [ ] Render account created
- [ ] GitHub connected to Render
- [ ] Repository selected

#### ✅ Web Service Configuration
- [ ] Service name: `loscos-pizzeria` (or preferred name)
- [ ] Environment: `Node`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Plan: Free (or paid)

#### ✅ Environment Variables (Render)
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL` added
- [ ] `GOOGLE_PRIVATE_KEY` added (with quotes and \n)
- [ ] `GOOGLE_SPREADSHEET_ID` added
- [ ] `TWILIO_ACCOUNT_SID` added (if using SMS)
- [ ] `TWILIO_AUTH_TOKEN` added (if using SMS)
- [ ] `TWILIO_PHONE_NUMBER` added (if using SMS)
- [ ] `BUSINESS_PHONE_NUMBER` added (if using SMS)
- [ ] All variables saved

#### ✅ Deployment
- [ ] Initial deployment successful
- [ ] Build logs show no errors
- [ ] Site accessible at Render URL
- [ ] Order submission tested on live site
- [ ] Google Sheet receiving orders

## Post-Deployment Testing

### ✅ Functionality Tests
- [ ] Homepage loads correctly
- [ ] Menu displays properly
- [ ] Cart opens and functions
- [ ] Order form displays
- [ ] Phone validation works
- [ ] Order submission successful
- [ ] Confirmation modal shows
- [ ] Google Sheet updated
- [ ] SMS notification received (if configured)

### ✅ Cross-Browser Testing
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Mobile browsers

### ✅ Performance
- [ ] Page load times acceptable
- [ ] Images optimized
- [ ] No console errors
- [ ] Responsive design working

### ✅ Platform-Specific Tests

#### Vercel:
- [ ] Preview deployments working
- [ ] Analytics dashboard accessible
- [ ] Custom domain setup (if needed)
- [ ] Edge functions working (if used)

#### Render:
- [ ] Service logs accessible
- [ ] Auto-scaling working (if configured)
- [ ] Custom domain setup (if needed)

## Monitoring & Maintenance

### ✅ Regular Checks
- [ ] Monitor deployment logs for errors
- [ ] Check Google Sheet for new orders
- [ ] Verify order submission success rate
- [ ] Test site functionality weekly

### ✅ Updates
- [ ] Keep dependencies updated
- [ ] Monitor for security updates
- [ ] Backup Google Sheet regularly
- [ ] Test after any code changes

## Troubleshooting Quick Reference

| Issue | Vercel Solution | Render Solution |
|-------|----------------|-----------------|
| Build fails | Check build logs, verify package.json | Check build logs, verify package.json |
| Orders not submitting | Verify environment variables | Verify environment variables |
| Google Sheet not updating | Check service account permissions | Check service account permissions |
| Site not loading | Check Vercel service status | Check Render service status |
| Phone validation errors | Verify phone input format | Verify phone input format |
| Slow loading | Check Vercel analytics | Check Render logs |
| Preview deployments | Use Vercel preview URLs | Not available on Render |

## Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Render Documentation**: https://render.com/docs
- **Google Sheets API**: https://developers.google.com/sheets/api
- **Next.js Documentation**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

## Emergency Contacts

- **Vercel Support**: Available in dashboard
- **Render Support**: Available in dashboard
- **Google Cloud Support**: Available with paid plan
- **GitHub Issues**: For code-related problems

## Platform Comparison

| Feature | Vercel | Render |
|---------|--------|--------|
| **Next.js Optimization** | ✅ Perfect | ⚠️ Good |
| **Deployment Speed** | ✅ 1-2 minutes | ⚠️ 2-5 minutes |
| **Global CDN** | ✅ Yes | ❌ No |
| **Preview Deployments** | ✅ Yes | ❌ No |
| **Free Tier Limits** | ✅ Generous | ⚠️ Limited |
| **Custom Domains** | ✅ Easy | ✅ Easy |
| **SSL/HTTPS** | ✅ Automatic | ✅ Automatic |
| **Analytics** | ✅ Built-in | ❌ No |

---

**Recommendation**: Use Vercel for the best Next.js experience and performance!

**Remember**: Always test thoroughly in both local and production environments before making changes live! 