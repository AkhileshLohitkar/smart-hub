import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "client", "dist");
  if (!fs.existsSync(distPath)) {
    // Fallback for different build structures
    const fallbackPath = path.resolve(__dirname, "..", "dist", "public");
    if (fs.existsSync(fallbackPath)) {
      return serveFrom(app, fallbackPath);
    }
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }
  serveFrom(app, distPath);
}

function serveFrom(app: Express, distPath: string) {
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
