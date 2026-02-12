# MathPro - ChatGPT Handwriting App

Converts text and math equations into realistic handwritten style, right inside ChatGPT.

## Files

```
mathpro-app/
├── server.js                    ← MCP server (the doorbell ChatGPT rings)
├── package.json                 ← Dependencies list
├── vercel.json                  ← Tells Vercel how to host it
├── public/
│   └── mathpro-widget.html      ← The handwriting renderer (shown in ChatGPT)
└── README.md                    ← This file
```

## Setup Steps

### 1. Upload to GitHub
- Create new repo named `mathpro-app` on github.com
- Upload ALL these files keeping the folder structure

### 2. Deploy on Vercel (free)
- Go to vercel.com → Sign in with GitHub
- Click "New Project" → Select `mathpro-app` repo
- Click "Deploy" → Wait ~30 seconds
- Copy your URL: `https://mathpro-app.vercel.app`

### 3. Connect to ChatGPT
- ChatGPT → Settings → Apps & Connectors → Advanced → Enable Developer Mode
- Click "Create" under Connectors
- Paste: `https://mathpro-app.vercel.app/mcp`
- Name: "MathPro"
- Description: "Convert text and math to handwritten style"
- Click Create

### 4. Use it
- New chat → Click "+" → Select MathPro
- Type: "Write the quadratic formula in handwriting"
- MathPro widget appears with handwritten output!
