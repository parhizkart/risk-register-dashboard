# Upload to GitHub Using Web Browser (No Command Line)

If you don't have git or Node.js installed, use this method instead.

## Step 1: Create a New GitHub Repository

1. Go to **GitHub.com** (sign in or create account)
2. Click the **+** icon (top right) → **New Repository**
3. Name it: `risk-register-dashboard`
4. Set it to **Public** (so Vercel can see it)
5. Click **Create Repository**

---

## Step 2: Create Folder Structure Using GitHub's Web Interface

On the new repository page:

### Create `public` folder:

1. Click **"Add file"** → **"Create new file"**
2. In the filename box, type: `public/index.html`
3. GitHub automatically creates the `public/` folder
4. Paste the contents of `public-index.html` into the editor
5. Click **"Commit changes"** at the bottom

### Create `src` folder with `index.js`:

1. Click **"Add file"** → **"Create new file"**
2. Type: `src/index.js`
3. Paste the contents of `src-index.js` into the editor
4. Click **"Commit changes"**

### Create `src/App.jsx`:

1. Click **"Add file"** → **"Create new file"**
2. Type: `src/App.jsx`
3. Paste **the entire contents** of `utility-risk-register.jsx` into the editor
4. Click **"Commit changes"**

### Upload `package.json`:

1. Click **"Add file"** → **"Upload files"**
2. Drag `package.json` into the box (or click to browse)
3. Click **"Commit changes"**

### Upload `.gitignore`:

1. Click **"Add file"** → **"Upload files"**
2. Drag `.gitignore` into the box
3. Click **"Commit changes"**

---

## Step 3: Your Repository Should Now Look Like:

```
risk-register-dashboard/
├── .gitignore
├── package.json
├── public/
│   └── index.html
└── src/
    ├── App.jsx
    └── index.js
```

---

## Step 4: Deploy to Vercel

1. Go to **Vercel.com** and log in (or sign up with GitHub)
2. Click **"Add New"** → **"Project"**
3. Click **"Import Git Repository"**
4. Search for and select **`risk-register-dashboard`**
5. Click **Import**
6. Vercel detects it's a React app (no special settings needed)
7. Click **"Deploy"**
8. Wait 2–3 minutes for the build
9. You'll get a live URL! 🎉

---

## Step 5: Connect to Your Wix Site

Once you have the Vercel URL:

1. Log into **Wix Studio**
2. Edit your website
3. Add a **Button** or **Text Link**
4. Click the link icon and select **External URL**
5. Paste your Vercel dashboard URL
6. Save and Publish

Done! Your risk register is now live.

---

## If You Get Stuck

Let me know:
- Which step you're on
- Any error messages you see
- I'll help you troubleshoot
