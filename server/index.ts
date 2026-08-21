import "./loadEnv";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { registerWhatsAppWorksheetRoute } from "./routes/whatsappWorksheetRoute";
import { serveStatic } from "./static";
import { setupAuth } from "./auth";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getFreeWorksheetLimit } from "./config/pricing";
import path from "node:path";
const app = express();
app.use(express.json())
app.use ("/generated-pdfs", express.static(path.join(process.cwd(), "generated-pdfs")));
const httpServer = createServer(app);

function listenHttp(server: Server, startPort: number): Promise<number> {
  const maxTries = process.env.NODE_ENV === "production" ? 1 : 24;
  const tryOnce = (p: number) =>
    new Promise<void>((resolve, reject) => {
      const listenOpts: { port: number; host: string; reusePort?: boolean } = {
        port: p,
        host: "0.0.0.0",
      };
      if (process.platform !== "win32") {
        listenOpts.reusePort = true;
      }
      const onErr = (e: NodeJS.ErrnoException) => {
        server.off("error", onErr);
        reject(e);
      };
      server.once("error", onErr);
      server.listen(listenOpts, () => {
        server.off("error", onErr);
        resolve();
      });
    });

  return (async () => {
    for (let i = 0; i < maxTries; i++) {
      const p = startPort + i;
      try {
        await tryOnce(p);
        if (i > 0) {
          log(`port ${startPort} in use, serving on ${p} instead`);
        }
        return p;
      } catch (e: unknown) {
        const err = e as NodeJS.ErrnoException;
        if (err.code === "EADDRINUSE" && i < maxTries - 1) {
          continue;
        }
        throw e;
      }
    }
    throw new Error(`No free port found starting at ${startPort}`);
  })();
}

app.use(express.json({
  limit: "50mb",
  verify: (req: any, _res: any, buf: Buffer) => {
    req.rawBody = buf.toString("utf8");
  },
}));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await setupAuth(app);
  await registerRoutes(httpServer, app);
  await registerWhatsAppWorksheetRoute(app);
  void storage.syncFreePaymentWorksheetLimits(getFreeWorksheetLimit()).then((count) => {
    if (count > 0) {
      log(`synced ${count} free plan payment record(s) to worksheet limit ${getFreeWorksheetLimit()}`);
    }
  }).catch((err) => {
    console.warn("[Startup] Could not sync free payment worksheet limits:", err);
  });

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const preferredPort = parseInt(process.env.PORT || "5000", 10);
  const boundPort = await listenHttp(httpServer, preferredPort);
  log(`serving on port ${boundPort}`);
})();
