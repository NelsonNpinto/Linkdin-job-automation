# LinkedIn Auto Apply - Frontend

React frontend for the LinkedIn job application bot.

## Deployment to Netlify

### Step 1: Build the Project Locally (Optional Test)
```bash
cd frontend
npm install
npm run build
```

### Step 2: Deploy to Netlify

#### Option A: Using Netlify CLI (Recommended)
1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

3. Deploy from the frontend directory:
```bash
cd frontend
netlify deploy --prod
```

4. Follow the prompts:
   - Create a new site or link to existing
   - Build directory: `dist`
   - The CLI will give you a URL

#### Option B: Using Netlify Web UI
1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository (GitHub/GitLab/Bitbucket)
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Add environment variable:
   - **Key:** `VITE_API_URL`
   - **Value:** Your backend URL (e.g., `http://your-mac-ip:3001` or ngrok URL)
6. Click "Deploy site"

#### Option C: Drag & Drop (Quickest for Testing)
1. Build locally: `npm run build`
2. Go to [netlify.com/drop](https://app.netlify.com/drop)
3. Drag the `dist` folder to the upload area
4. Get instant URL

### Step 3: Configure Backend URL

After deployment, you need to set the backend URL:

1. In Netlify dashboard → Site settings → Environment variables
2. Add variable:
   - **Key:** `VITE_API_URL`
   - **Value:** Your backend URL

**Important:** Your backend must be accessible from the internet. Options:
- Keep your Mac running with backend on port 3001
- Use ngrok: `ngrok http 3001` (gives you a public URL)
- Use Cloudflare Tunnel
- Deploy backend to a cloud server

### Step 4: Redeploy

After adding the environment variable, trigger a redeploy:
- Netlify dashboard → Deploys → Trigger deploy → Deploy site

## Local Development

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies API calls to `http://localhost:3001`.

## Environment Variables

- `VITE_API_URL` - Backend API URL (defaults to `http://localhost:3001` for local dev)
