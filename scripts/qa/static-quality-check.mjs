/* global console */
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const failures = [];
const checks = [];

function record(name, passed, details = "") {
  checks.push({ name, passed, details });
  if (!passed) failures.push(`${name}${details ? `: ${details}` : ""}`);
}

async function text(relativePath) {
  return readFile(path.join(projectRoot, relativePath), "utf8");
}

async function filesUnder(relativeDirectory) {
  const root = path.join(projectRoot, relativeDirectory);
  const output = [];
  async function walk(directory) {
    for (const entry of await readdir(directory)) {
      const absolute = path.join(directory, entry);
      const metadata = await stat(absolute);
      if (metadata.isDirectory()) await walk(absolute);
      else output.push(absolute);
    }
  }
  await walk(root);
  return output;
}

const indexHtml = await text("client/index.html");
record(
  "Responsive viewport metadata",
  /<meta\s+name=["']viewport["'][^>]*width=device-width/i.test(indexHtml),
);

const responsiveFiles = [
  "client/src/layouts/public-layout.jsx",
  "client/src/layouts/dashboard/dashboard-shell.jsx",
  "client/src/layouts/dashboard/dashboard-header.jsx",
  "client/src/pages/match-review.page.jsx",
  "client/src/pages/admin-players.page.jsx",
];
for (const file of responsiveFiles) {
  const source = await text(file);
  record(
    `Responsive utility coverage: ${file}`,
    /(?:sm|md|lg|xl):/.test(source),
    "Expected at least one Tailwind breakpoint utility.",
  );
}

const sidebarSource = await text("client/src/layouts/dashboard/dashboard-sidebar.jsx");
record(
  "Dashboard sidebar exposes labelled navigation",
  /<nav[\s\S]*aria-label=/.test(sidebarSource),
);

const clientFiles = (await filesUnder("client/src")).filter((file) =>
  /\.(?:js|jsx)$/.test(file),
);
const forbiddenClientSecrets = [
  "MONGODB_URI",
  "BETTER_AUTH_SECRET",
  "CLOUDINARY_API_SECRET",
  "GOOGLE_VISION_API_KEY",
  "OPENAI_API_KEY",
];
for (const secretName of forbiddenClientSecrets) {
  const offenders = [];
  for (const file of clientFiles) {
    const source = await readFile(file, "utf8");
    if (source.includes(secretName)) offenders.push(path.relative(projectRoot, file));
  }
  record(
    `No server secret identifier in client: ${secretName}`,
    offenders.length === 0,
    offenders.join(", "),
  );
}

const sourceFiles = [
  ...(await filesUnder("client/src")),
  ...(await filesUnder("server/src")),
].filter((file) => /\.(?:js|jsx)$/.test(file));
const incompleteMarkers = [
  "// existing code",
  "// add your logic here",
  "// rest of the code",
];
for (const marker of incompleteMarkers) {
  const offenders = [];
  for (const file of sourceFiles) {
    const source = await readFile(file, "utf8");
    if (source.toLowerCase().includes(marker)) {
      offenders.push(path.relative(projectRoot, file));
    }
  }
  record(
    `No incomplete-code marker: ${marker}`,
    offenders.length === 0,
    offenders.join(", "),
  );
}

const appSource = await text("server/src/app.js");
record("Helmet is enabled", /app\.use\(\s*helmet\(/m.test(appSource));
record("CORS middleware is enabled", /app\.use\(cors\(corsOptions\)\)/.test(appSource));
record("Rate limiting is enabled", /app\.use\(apiRateLimiter\)/.test(appSource));
record(
  "Better Auth is mounted before JSON parsing",
  appSource.indexOf('app.all("/api/auth/*splat"') <
    appSource.indexOf("app.use(express.json"),
);
record("X-Powered-By is disabled", /app\.disable\("x-powered-by"\)/.test(appSource));

const errorSource = await text("server/src/middleware/error.middleware.js");
record(
  "Malformed JSON receives a client error",
  errorSource.includes('code: "INVALID_JSON_BODY"') &&
    errorSource.includes("statusCode: 400"),
);
record(
  "Production stack traces are not returned",
  /!env\.isProduction\s*&&\s*normalizedError\.statusCode\s*===\s*500/.test(errorSource),
);

const packageJson = JSON.parse(await text("package.json"));
record("Root QA command exists", Boolean(packageJson.scripts?.qa));
record("Coverage command exists", Boolean(packageJson.scripts?.["test:coverage"]));
record("Critical-test command exists", Boolean(packageJson.scripts?.["test:critical"]));

for (const check of checks) {
  console.log(
    `${check.passed ? "PASS" : "FAIL"}  ${check.name}${check.details && !check.passed ? ` — ${check.details}` : ""}`,
  );
}

if (failures.length) {
  console.error(`\nStatic QA failed with ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(`\nStatic QA passed (${checks.length} checks).`);
