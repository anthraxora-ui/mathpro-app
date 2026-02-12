import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

// Read widget HTML — Vercel bundles this file via includeFiles in vercel.json
let widgetHtml;
try {
  widgetHtml = readFileSync(join(process.cwd(), "mathpro-widget.html"), "utf8");
} catch (e) {
  try {
    widgetHtml = readFileSync(join(__dirname, "..", "mathpro-widget.html"), "utf8");
  } catch (e2) {
    widgetHtml = "<html><body><p>MathPro widget loading error</p></body></html>";
    console.error("Could not read widget file:", e2.message);
  }
}

function createMathProServer() {
  const server = new McpServer({ name: "mathpro-app", version: "1.0.0" });

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
                resourceDomains: [
                  "https://raw.githubusercontent.com",
                  "https://cdn.jsdelivr.net",
                  "https://cdnjs.cloudflare.com",
                ],
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
        content: [{ type: "text", text: "Here is your handwritten version." }],
        structuredContent: { content },
      };
    }
  );

  return server;
}

// Vercel serverless function handler
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type, mcp-session-id");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

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
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
