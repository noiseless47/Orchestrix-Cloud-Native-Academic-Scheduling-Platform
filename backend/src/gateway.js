import dotenv from "dotenv";
import express from "express";
import http from "http";
import morgan from "morgan";
import cors from "cors";
import { randomUUID } from "crypto";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);

const routes = {
  "/api/subjects": process.env.SUBJECTS_URL || "http://subjects:5101",
  "/api/teachers": process.env.TEACHERS_URL || "http://teachers:5102",
  "/api/sections": process.env.SECTIONS_URL || "http://sections:5103",
  "/api/routines": process.env.ROUTINES_URL || "http://routines:5104",
};

const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true, credentials: true }));
app.use(morgan("combined"));

app.get("/api/health", async (_req, res) => {
  const checks = await Promise.all(
    Object.entries(routes).map(async ([route, baseUrl]) => {
      try {
        const response = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(3000) });
        return [route, response.ok ? "up" : "degraded"];
      } catch {
        return [route, "down"];
      }
    })
  );
  const services = Object.fromEntries(checks);
  const healthy = Object.values(services).every((status) => status === "up");
  res.status(healthy ? 200 : 503).json({ status: healthy ? "ok" : "degraded", services });
});

app.use("/api", (req, res) => {
  const baseUrl = Object.entries(routes).find(([prefix]) => req.path.startsWith(prefix.replace("/api", "")))?.[1];
  if (!baseUrl) {
    return res.status(404).json({ message: "Unknown API route" });
  }

  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const url = new URL(req.originalUrl, baseUrl);
    const request = http.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        method: req.method,
        headers: {
          ...req.headers,
          host: url.host,
          "x-correlation-id": req.headers["x-correlation-id"] || randomUUID(),
          "content-length": body.length,
        },
        timeout: 8000,
      },
      (proxyResponse) => {
        res.status(proxyResponse.statusCode || 502);
        Object.entries(proxyResponse.headers).forEach(([name, value]) => {
          if (value !== undefined) res.setHeader(name, value);
        });
        proxyResponse.pipe(res);
      }
    );

    request.on("timeout", () => request.destroy(new Error("Domain service timeout")));
    request.on("error", (error) => {
      console.error("Gateway proxy error:", error.message);
      if (!res.headersSent) res.status(502).json({ message: "Domain service unavailable" });
    });
    if (body.length) request.write(body);
    request.end();
  });
});

app.use((_req, res) => res.status(404).json({ message: "Not found" }));

app.listen(port, "0.0.0.0", () => {
  console.log(`API gateway running on port ${port}`);
});
