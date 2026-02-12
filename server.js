import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

// Read the widget HTML file (our handwriting renderer)
const widgetHtml = readFileSync("mathpro-widget.html", "utf8");


function createMathProServer() {
  const server = new McpServer({ name: "mathpro-app", version: "1.0.0" });

  // Register the widget — this is what ChatGPT shows in the iframe
  registerAppResource(
    server,
    "mathpro-widget",
    "ui://widget/mathpro.html",
    {},
    async () => ({
      contents: [
        {
          uri: "ui://widget/mathpro.html",
          mimeType: RESOURCE_MIME_TYPE,
          text: widgetHtml,
          _meta: {
            ui: {
              prefersBorder: true,
              domain: "https://mathpro-app.vercel.app",
              csp: {
                // Allow loading font from GitHub
                resourceDomains: [
                  "https://raw.githubusercontent.com",
                  "https://cdn.jsdelivr.net",
                  "https://cdnjs.cloudflare.com",
                ],
                // Allow MathJax CDN calls
                connectDomains: [
                  "https://cdn.jsdelivr.net",
                  "https://cdnjs.cloudflare.com",
                ],
              },
            },
          },
        },
      ],
    })
  );

  // Tool 1: Render handwriting
  // ChatGPT calls this when user says "write in handwriting" or similar
  registerAppTool(
    server,
    "render_handwriting",
    {
      title: "Render handwriting",
      description:
        "Use this when the user wants to convert text, math equations, or notes into realistic handwritten style. Accepts plain text and LaTeX math (use $...$ for inline math, $$ for display math).",
      inputSchema: {
        content: z.string().describe("The text and/or LaTeX math to render as handwriting"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        ui: { resourceUri: "ui://widget/mathpro.html" },
      },
    },
    async (args) => {
      const content = args?.content?.trim?.() ?? "";
      if (!content) {
        return {
          content: [{ type: "text", text: "Please provide some text or math to render." }],
          structuredContent: { content: "", error: "No content provided" },
        };
      }
      return {
        content: [{ type: "text", text: "Here's your handwritten version." }],
        structuredContent: { content },
      };
    }
  );

  return server;
}

// HTTP server setup
const port = Number(process.env.PORT ?? 3000);
const MCP_PATH = "/mcp";

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  // CORS preflight
  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    res.end();
    return;
  }

  // Health check
  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/plain" }).end("MathPro MCP server is running");
    return;
  }

  // MCP endpoint
  const MCP_METHODS = new Set(["POST", "GET", "DELETE"]);
  if (url.pathname === MCP_PATH && req.method && MCP_METHODS.has(req.method)) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const server = createMathProServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("MCP error:", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal server error");
      }
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(port, () => {
  console.log(`MathPro MCP server listening on http://localhost:${port}${MCP_PATH}`);
});
