# 🚀 Deployment Guide - GitHub + Vercel

## Quick Start

This project uses **Lovable Cloud** for shared database caching. When anyone clicks "Refresh", the cache updates for ALL users - everyone sees the same data automatically!

---

## How It Works

### First Visit (Any User):
- Dashboard loads cached data from database instantly
- Shows last refresh time
- If no cache exists, shows "Click Refresh to load latest data"

### When Anyone Clicks "Refresh":
1. API processes all CSV/Excel files
2. Updates the **shared database cache**
3. ALL users see the updated data on their next page load
4. Also cached in browser localStorage for instant subsequent visits

### Magic: Shared Cache
- One database cache shared by everyone
- When User A refreshes → All users (B, C, D...) see new data
- No need for each user to click refresh separately
- Perfect for team dashboards

---

## Step-by-Step Deployment

### 1. Connect to GitHub

1. In Lovable editor, click **GitHub** button (top right)
2. Authorize Lovable GitHub App
3. Click **"Create Repository"**
4. Your code will be automatically synced to GitHub

### 2. Add Data Files to GitHub

You need to add your data files to the repository:

**Via GitHub Web Interface:**

1. Go to your GitHub repository
2. Navigate to `public/` folder
3. Upload `customer_master.csv`
4. Click "Add file" → "Create new file"
5. Name it: `sales_data/q1.xlsx` (this creates the folder)
6. Upload all your Excel files: `q1.xlsx`, `q2.xlsx`, ..., `current.xlsx`

**Via Git Command Line (if you know Git):**

```bash
# Clone your repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Copy your data files
cp /path/to/customer_master.csv public/
cp /path/to/sales_data/*.xlsx public/sales_data/

# Commit and push
git add .
git commit -m "Add data files"
git push
```

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/login (use GitHub account for easy connection)
3. Click **"New Project"**
4. Click **"Import Git Repository"**
5. Select your GitHub repository
6. Vercel will auto-detect settings:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
7. Click **"Deploy"**
8. Wait 1-2 minutes for deployment to complete

### 4. First Load & Setup

1. Visit your deployed site: `https://your-project.vercel.app`
2. If no data is cached yet, you'll see "Click Refresh to load latest data"
3. Click the **"Refresh"** button
4. API processes all data and saves to shared database
5. Done! 🎉 All users now see this data automatically

**Note:** After deployment, the database cache is automatically configured via Lovable Cloud. No additional setup needed!

---

## How It Works

### Shared Database Cache System:
- All users share ONE cache stored in Lovable Cloud database
- When anyone clicks "Refresh", the shared cache updates
- All users automatically see the latest data
- Also cached locally in browser for instant subsequent loads

### Data Flow:
1. **Initial Load**: Fetches from shared database → Falls back to `cache.json` if empty
2. **Refresh Click**: Processes files → Updates database → All users see new data
3. **Background Sync**: Browser checks database for updates in background

**Result:** One person refreshes, everyone benefits!

---

## Updating Data

### Daily Update (current.xlsx):

**Option A: Via GitHub Web**
1. Go to your GitHub repo
2. Navigate to `public/sales_data/current.xlsx`
3. Click "Upload files" and replace it
4. Vercel auto-deploys (takes ~1 minute)
5. Users click "Refresh" to see updated data in their browser

**Option B: Via Git**
```bash
git pull
cp /path/to/new/current.xlsx public/sales_data/
git add public/sales_data/current.xlsx
git commit -m "Update current sales data"
git push
```

### Adding New Quarter Files:

1. Upload `q8.xlsx` to `public/sales_data/` in GitHub
2. Edit `public/config.json`:
```json
{
  "salesFiles": [
    "q1.xlsx",
    "q2.xlsx",
    "q3.xlsx",
    "q4.xlsx",
    "q5.xlsx",
    "q6.xlsx",
    "q7.xlsx",
    "q8.xlsx",
    "current.xlsx"
  ]
}
```
3. Commit and push
4. Vercel auto-deploys
5. Users click "Refresh" to see new quarter data

---

## Project Structure

```
your-project/
├── api/
│   └── update-cache.js      ← Serverless API function
├── public/
│   ├── cache.json           ← Initial empty cache (optional)
│   ├── config.json          ← Your configuration
│   ├── customer_master.csv  ← Your customer data
│   └── sales_data/
│       ├── q1.xlsx
│       ├── q2.xlsx
│       ├── current.xlsx
│       └── ...
├── src/                     ← React application
├── vercel.json              ← Vercel configuration
└── DEPLOYMENT.md            ← This file
```

---

## Configuration (public/config.json)

```json
{
  "customerMasterFile": "/customer_master.csv",
  "salesDataFolder": "/sales_data",
  "salesFiles": [
    "q1.xlsx",
    "q2.xlsx",
    "q3.xlsx",
    "q4.xlsx",
    "q5.xlsx",
    "q6.xlsx",
    "q7.xlsx",
    "current.xlsx"
  ],
  "autoRefreshInterval": 30000
}
```

**Note:** `autoRefreshInterval` is not used in the serverless version. Cache only updates when someone clicks "Refresh".

---

## Troubleshooting

### "Click Refresh to load latest data" message
- This means your browser hasn't loaded data yet
- Click the "Refresh" button to fetch and cache data
- Wait 5-10 seconds for processing
- Data will load instantly on your next visit

### API Error on Refresh
- Check Vercel deployment logs: `vercel.com` → Your Project → Deployments → View Function Logs
- Ensure all files exist in `public/` folder
- Verify `config.json` has correct file paths

### Data Not Updating
- Data updates in shared database when anyone clicks "Refresh"
- All users will see updates on their next page load/visit
- Check browser console (F12) for errors
- Verify files were uploaded to GitHub
- Wait for Vercel auto-deployment to complete (~1-2 min)

### Vercel Build Failed
- Check you have `@supabase/supabase-js`, `node-fetch@2`, `papaparse`, and `xlsx` in dependencies
- Lovable automatically manages dependencies
- If issues persist, try redeploying from Vercel dashboard

### Environment Variables on Vercel
- Lovable Cloud automatically provides `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- These are configured automatically when you enable Lovable Cloud
- No manual setup needed

---

## Performance

- **Initial Load**: < 1 second (from database or browser cache)
- **First Load (cold start)**: Click "Refresh" button
- **Refresh Time**: 5-15 seconds (depends on file sizes)
- **Shared Cache**: Everyone sees same data automatically
- **Vercel Free Tier**: 
  - 100 GB bandwidth/month
  - 100 hours serverless execution/month
  - More than enough for this dashboard
- **Lovable Cloud**: Free tier includes database storage and API calls

---

## Benefits

✅ **Shared Cache** - One person refreshes, everyone sees updates  
✅ **Fast Loading** - Database + browser caching  
✅ **Instant Returns** - Data loads instantly on return visits  
✅ **Team Friendly** - Perfect for teams using same dashboard  
✅ **Low Bandwidth** - Only refresh button processes files  
✅ **Serverless** - No server management  
✅ **Free Hosting** - GitHub + Vercel + Lovable Cloud free tiers  
✅ **Auto Deploy** - Push to GitHub → Auto deployed  
✅ **Real-time Updates** - Shared database keeps everyone in sync

---

## Support

- **Lovable Docs**: https://docs.lovable.dev
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Docs**: https://docs.github.com

For issues, check the browser console (F12) and Vercel function logs.
