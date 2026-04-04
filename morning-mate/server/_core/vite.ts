import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  // Serve manifest.json explicitly (BEFORE wildcard route to prevent auth redirect)
  app.get("/manifest.json", (req, res) => {
    const manifestPath = path.resolve(
      import.meta.dirname,
      "../..",
      "client",
      "public",
      "manifest.json"
    );
    res.setHeader("Content-Type", "application/manifest+json");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.sendFile(manifestPath, (err) => {
      if (err) {
        console.error("[Manifest] Error serving manifest.json:", err);
        res.status(404).json({ error: "Manifest not found" });
      }
    });
  });

  // Serve other public files (favicon, robots.txt, etc)
  app.use(express.static(path.resolve(import.meta.dirname, "../..", "client", "public")));

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

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
  // Use process.cwd() in production — reliable in Docker where WORKDIR=/app.
  // Fall back to import.meta.dirname in dev.
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.join(process.cwd(), "dist", "public");

  console.log(`[Static] Serving from: ${distPath}`);

  if (!fs.existsSync(distPath)) {
    console.error(
      `[Static] ERROR: Build directory not found: ${distPath}. Run pnpm build first.`
    );
  } else {
    const files = fs.readdirSync(distPath);
    console.log(`[Static] Found ${files.length} files/dirs in build directory`);
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
