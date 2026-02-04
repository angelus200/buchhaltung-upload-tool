import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { clerkMiddleware } from "@clerk/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Clerk authentication middleware
  app.use(clerkMiddleware());

  // Static file serving for uploaded belege (Railway Volume or local)
  const BELEGE_BASE_PATH = process.env.NODE_ENV === 'production'
    ? '/data/belege'
    : path.join(process.cwd(), 'uploads', 'belege');
  app.use('/belege', express.static(BELEGE_BASE_PATH));

  // Dropbox OAuth Callback Handler
  app.get('/api/dropbox/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Dropbox Autorisierung fehlgeschlagen</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; text-align: center; }
            .error { color: #dc2626; margin: 20px 0; }
            button { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
          </style>
        </head>
        <body>
          <h1>❌ Autorisierung fehlgeschlagen</h1>
          <p class="error">${error}</p>
          <button onclick="window.close()">Fenster schließen</button>
        </body>
        </html>
      `);
    }

    if (!code || !state) {
      return res.status(400).send('Missing code or state parameter');
    }

    const unternehmenId = parseInt(state as string);
    if (isNaN(unternehmenId)) {
      return res.status(400).send('Invalid unternehmenId');
    }

    // Return HTML mit JavaScript das die Verbindung speichert
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dropbox wird verbunden...</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            padding: 40px;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            color: #1f2937;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            max-width: 500px;
          }
          .spinner {
            border: 4px solid #f3f4f6;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .success { color: #10b981; font-size: 48px; margin: 20px 0; }
          .error { color: #dc2626; margin: 20px 0; }
          button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
          }
          button:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div id="loading">
            <h1>Dropbox wird verbunden...</h1>
            <div class="spinner"></div>
            <p>Bitte warten Sie einen Moment.</p>
          </div>
          <div id="success" style="display: none;">
            <div class="success">✓</div>
            <h1>Erfolgreich verbunden!</h1>
            <p>Ihr Dropbox-Account wurde erfolgreich verbunden.</p>
            <button onclick="closeAndRefresh()">Fertig</button>
          </div>
          <div id="error" style="display: none;">
            <div class="error">✗</div>
            <h1>Verbindung fehlgeschlagen</h1>
            <p id="error-message"></p>
            <button onclick="window.close()">Fenster schließen</button>
          </div>
        </div>

        <script>
          async function connectDropbox() {
            try {
              const response = await fetch('/api/trpc/dropbox.handleCallback', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  code: '${code}',
                  unternehmenId: ${unternehmenId},
                  watchFolder: '/Belege'
                })
              });

              const data = await response.json();

              if (data.result?.data?.success) {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('success').style.display = 'block';
              } else {
                throw new Error(data.error?.message || 'Unbekannter Fehler');
              }
            } catch (error) {
              document.getElementById('loading').style.display = 'none';
              document.getElementById('error').style.display = 'block';
              document.getElementById('error-message').textContent = error.message;
            }
          }

          function closeAndRefresh() {
            if (window.opener) {
              window.opener.location.reload();
            }
            window.close();
          }

          // Start connection process
          connectDropbox();
        </script>
      </body>
      </html>
    `);
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
