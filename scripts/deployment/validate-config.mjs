import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const checks = [];

function check(name, condition, details = null) {
  checks.push({ name, success: Boolean(condition), details });
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const vercel = JSON.parse(read("vercel.json"));
check("Vercel installs from workspace root", vercel.installCommand === "npm ci");
check("Vercel builds the client workspace", vercel.buildCommand === "npm run build");
check("Vercel output points to client/dist", vercel.outputDirectory === "client/dist");
check(
  "Vercel SPA rewrite exists",
  vercel.rewrites?.some(
    (item) => item.source === "/(.*)" && item.destination === "/index.html",
  ),
);

const render = read("render.yaml");
check("Render uses Node runtime", render.includes("runtime: node"));
check(
  "Render uses production-only install",
  render.includes("buildCommand: npm ci --omit=dev"),
);
check(
  "Render starts server workspace",
  render.includes("startCommand: npm run start -w server"),
);
check(
  "Render health check is configured",
  render.includes("healthCheckPath: /api/v1/health"),
);
check(
  "Render deploys only after checks pass",
  render.includes("autoDeployTrigger: checksPass"),
);
check("Render secret values are not committed", !render.includes("mongodb+srv://"));

const railway = read("railway.toml");
check("Railway uses Railpack", railway.includes('builder = "RAILPACK"'));
check(
  "Railway starts server workspace",
  railway.includes('startCommand = "npm run start -w server"'),
);
check(
  "Railway health check is configured",
  railway.includes('healthcheckPath = "/api/v1/health"'),
);

const serverProductionEnv = read("server/.env.production.example");
check(
  "Production env requires secure cross-origin cookies",
  serverProductionEnv.includes("AUTH_COOKIE_SAME_SITE=none"),
);
check(
  "Production env trusts platform proxy",
  serverProductionEnv.includes("TRUST_PROXY=true"),
);
check(
  "Production env uses Google Vision OCR",
  serverProductionEnv.includes("OCR_PROVIDER=google-vision"),
);

const clientProductionEnv = read("client/.env.production.example");
check(
  "Client API URL includes versioned prefix",
  clientProductionEnv.includes("/api/v1"),
);
check(
  "Frontend env contains no server secrets",
  !/(MONGODB_URI|BETTER_AUTH_SECRET|CLOUDINARY_API_SECRET|GOOGLE_VISION_API_KEY|OPENAI_API_KEY)/.test(
    clientProductionEnv,
  ),
);

const failed = checks.filter((item) => !item.success);
globalThis.console.log(JSON.stringify({ checks }, null, 2));

if (failed.length) {
  process.exitCode = 1;
}
