# Risk Register Dashboard — Deployment Guide

## Files Included

```
risk-register-dashboard/
├── package.json              ← Dependencies and build scripts
├── public/
│   └── index.html           ← Main HTML entry point
├── src/
│   ├── index.js             ← React entry point
│   └── App.jsx              ← Dashboard component (the main file)
└── .gitignore              ← Git ignore rules
```

## Fix for Vercel Deployment

Follow these steps to fix the 404 error:

### Step 1: Delete the Old Repo
Go to your GitHub repository settings and delete it, or simply archive it. We're starting fresh with the correct structure.

### Step 2: Create New GitHub Repo with Proper Structure

1. **On your computer**, create a new folder:
   ```bash
   mkdir risk-register-dashboard
   cd risk-register-dashboard
   ```

2. **Initialize git** (if git is installed on your machine):
   ```bash
   git init
   ```

3. **Copy all the files from this deployment package** into that folder:
   - `package.json` → root
   - `public/index.html` → create `public/` folder and put `index.html` inside
   - `src/index.js` → create `src/` folder and put `index.js` inside
   - `src/App.jsx` → put your dashboard file in `src/` folder
   - `.gitignore` → root

   Your folder structure should look like:
   ```
   risk-register-dashboard/
   ├── .gitignore
   ├── package.json
   ├── public/
   │   └── index.html
   └── src/
       ├── index.js
       └── App.jsx
   ```

### Step 3: Push to GitHub

1. Go to **GitHub.com** and create a NEW repository called `risk-register-dashboard`
2. Copy the commands GitHub shows (they look like):
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/risk-register-dashboard.git
   git push -u origin main
   ```

### Step 4: Deploy to Vercel (Fresh Deploy)

1. Go to **Vercel.com** and log in
2. Click **"Add New → Project"**
3. Import your **NEW** GitHub repository
4. Vercel automatically detects it's a React app
5. Click **Deploy**
6. Wait ~2 minutes for build to complete
7. You'll get a new URL like `https://risk-register-dashboard.vercel.app`

### Step 5: Add to Wix

Once the dashboard is live:

1. Go to **Wix Studio** and edit your site
2. Add a **Button** (or Text Link) where you want visitors to access the dashboard
3. Click the button → **Link icon** → **External URL**
4. Paste your new Vercel URL
5. Set button text: `"Open Risk Register"` or `"Risk & Mitigation Dashboard"`
6. **Publish**

---

## Troubleshooting

**Still seeing 404?**
- Clear your browser cache (Ctrl+Shift+Del)
- Wait 3–5 minutes for the build to fully deploy
- Check that all files are actually in the GitHub repo

**Blank page?**
- Open browser Developer Tools (F12)
- Check the Console tab for JavaScript errors
- Make sure `public/index.html` exists and has the `<div id="root"></div>` tag

**Build failed?**
- Make sure `package.json` is in the root directory
- Make sure `src/App.jsx` exists and exports a default component
- Check Vercel's build logs for specific error messages

---

## Local Testing (Optional)

If you want to test locally before deploying:

1. Install **Node.js** from nodejs.org (includes npm)
2. In your project folder, run:
   ```bash
   npm install
   npm start
   ```
3. Opens at `http://localhost:3000`

---

**Need help?** Let me know at what step you get stuck, and I'll walk you through it.
