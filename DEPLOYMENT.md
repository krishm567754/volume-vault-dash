# 🚀 Deployment Guide - GitHub + Vercel

## Quick Start

This project uses **browser-based caching** via serverless API. Each user's browser caches data locally for instant loading, and the "Refresh" button fetches the latest data from your files.

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

### 4. First Load

1. Visit your deployed site: `https://your-project.vercel.app`
2. You'll see "Click Refresh to load latest data"
3. Click the **"Refresh"** button
4. API will process all data and cache in your browser
5. Done! 🎉 Data loads instantly on next visit

---

## How It Works

### First Visit (New User):
- Shows "Click Refresh to load latest data" message
- User clicks "Refresh"
- API processes all files and returns calculated data
- Browser saves data to localStorage for instant future loads

### Return Visits:
- Data loads instantly from browser localStorage (< 1 second)
- No API calls needed
- Shows last refresh timestamp

### Clicking "Refresh":
1. Frontend calls `/api/update-cache` serverless function
2. API reads all files from `public/` folder (CSV + Excel files)
3. Processes customer master + all sales files
4. Calculates performance metrics
5. Returns fresh data to user
6. Browser saves to localStorage for next time

**Note:** Each user's browser has its own cache. This is perfect for personal dashboards or team dashboards where users refresh periodically to see latest data.

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
- Each user must click "Refresh" to update their browser cache
- Check browser console (F12) for errors
- Verify files were uploaded to GitHub
- Wait for Vercel auto-deployment to complete (~1-2 min)
- Try clearing browser cache (localStorage) if needed

### Vercel Build Failed
- Check you have `node-fetch@2`, `papaparse`, and `xlsx` in dependencies
- Lovable automatically manages dependencies
- If issues persist, try redeploying from Vercel dashboard

---

## Performance

- **Initial Load (returning user)**: < 1 second (from browser cache)
- **First Load (new user)**: Click "Refresh" button
- **Refresh Time**: 5-15 seconds (depends on file sizes)
- **Vercel Free Tier**: 
  - 100 GB bandwidth/month
  - 100 hours serverless execution/month
  - More than enough for this dashboard

---

## Benefits

✅ **Fast Loading** - Browser localStorage caching  
✅ **Instant Returns** - Data loads instantly on return visits  
✅ **Low Bandwidth** - Only refresh button processes files  
✅ **Serverless** - No server management  
✅ **Free Hosting** - GitHub + Vercel free tier  
✅ **Auto Deploy** - Push to GitHub → Auto deployed  
✅ **Real-time Updates** - Refresh button always fetches latest data

---

## Support

- **Lovable Docs**: https://docs.lovable.dev
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Docs**: https://docs.github.com

For issues, check the browser console (F12) and Vercel function logs.
