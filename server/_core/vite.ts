import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  // Don't import vite.config.ts - let Vite auto-discover it
  // Importing vite.config causes TOP-LEVEL import.meta.dirname to be undefined in esbuild bundle
  const vite = await createViteServer({
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Use process.cwd() with fallback for Railway compatibility
      const cwd = process.cwd() || "/app";
      const clientTemplate = path.join(cwd, "client", "index.html");

      console.log(`[setupVite] cwd: ${cwd}`);
      console.log(`[setupVite] clientTemplate: ${clientTemplate}`);

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Use absolute path for Railway compatibility
  // Railway working directory: /app
  // Static files location: /app/dist/public
  const cwd = process.cwd() || "/app";
  const distPath = path.join(cwd, "dist", "public");

  console.log(`[serveStatic] cwd: ${cwd}`);
  console.log(`[serveStatic] distPath: ${distPath}`);
  console.log(`[serveStatic] distPath exists: ${fs.existsSync(distPath)}`);

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = path.join(distPath, "index.html");
    console.log(`[serveStatic] Serving index.html from: ${indexPath}`);
    res.sendFile(indexPath);
  });
}
