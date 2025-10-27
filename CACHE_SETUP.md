# Cache Setup Instructions

## How the Caching System Works

The dashboard now uses a smart caching system to load instantly:

1. **First Load**: Shows data from `cache.json` (or localStorage if available) - **INSTANT**
2. **Manual Refresh**: User clicks "Refresh" button to load fresh data from files - **Takes time**
3. **Auto-Save**: After refresh, data is saved to browser's localStorage for next visit
4. **Data Consumption**: Only refresh button consumes data, not every page visit

## Benefits
✅ Dashboard loads instantly for all users  
✅ Minimal data consumption  
✅ Users see latest data after any refresh  
✅ No backend or database needed  

---

## Setup Instructions

### Option 1: Using the Cache Generator (Easiest)

1. Upload all your files to htdocs:
   - `customer_master.csv`
   - `sales_data/q1.xlsx`, `q2.xlsx`, etc.
   - `generate-cache.html`
   - All other built files

2. Open in browser: `http://yourdomain.com/generate-cache.html`

3. Click "Generate cache.json" button

4. Copy the generated JSON

5. Save it as `cache.json` in your htdocs folder

6. Done! Your dashboard will now load instantly

### Option 2: Manual Cache Update

Whenever you upload new sales files (e.g., new quarter data or update current.xlsx):

1. Visit: `http://yourdomain.com/generate-cache.html`
2. Click "Generate cache.json"
3. Replace the old `cache.json` with the new one
4. All users will see updated data instantly on next visit

---

## File Structure in htdocs

```
htdocs/
├── index.html
├── assets/           (CSS, JS files from dist)
├── cache.json        ← Generated cache file
├── config.json       ← Your configuration
├── customer_master.csv
├── sales_data/
│   ├── q1.xlsx
│   ├── q2.xlsx
│   ├── current.xlsx
│   └── ...
└── generate-cache.html  ← Tool to generate cache
```

---

## How to Update Data

### When you update current.xlsx (daily):
1. Upload new `current.xlsx` to `sales_data/`
2. Visit `generate-cache.html` and regenerate cache
3. Upload new `cache.json`

### When you add new quarter files:
1. Upload new `q8.xlsx` to `sales_data/`
2. Update `config.json` to include `"q8.xlsx"` in salesFiles array
3. Visit `generate-cache.html` and regenerate cache
4. Upload new `cache.json`

---

## Notes

- Users can always click "Refresh" to see latest data from files
- The cache just provides instant initial load
- After refresh, data is cached in user's browser (localStorage)
- No server-side code needed - everything works with static hosting
