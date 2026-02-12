# MathPro - ChatGPT Handwriting App

Converts text and math equations into realistic handwritten style, right inside ChatGPT.

## File Structure

```
mathpro-app/
├── api/
│   ├── mcp.js                  ← MCP server (handles ChatGPT requests)
│   └── index.js                ← Health check
├── mathpro-widget.html          ← The handwriting renderer widget
├── package.json                 ← Dependencies
├── vercel.json                  ← Vercel routing config
└── README.md
```

## Setup

1. Push to GitHub
2. Deploy on Vercel (free, sign in with GitHub)
3. Connect to ChatGPT: Settings → Connectors → paste `https://mathpro-app.vercel.app/mcp`
4. New chat → "+" → MathPro → "Write quadratic formula in handwriting"
