import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";

const app = new Hono();

// Health check
app.get("/api/health", (c) => c.json({ 
  status: "ok", 
  service: "univa-raids",
  timestamp: new Date().toISOString() 
}));

// Serve static frontend
app.use("/*", serveStatic({ root: "./public" }));

const port = Number(process.env.PORT) || 3001;

console.log(`Univa Raids server starting on port ${port}`);

serve({ fetch: app.fetch, port });
console.log(`Univa Raids running at http://localhost:${port}`);
