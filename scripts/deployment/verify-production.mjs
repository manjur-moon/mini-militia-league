/* global fetch */
import process from "node:process";

const apiUrl = process.env.PUBLIC_API_URL?.replace(/\/+$/, "");
const appUrl = process.env.PUBLIC_APP_URL?.replace(/\/+$/, "");

if (!apiUrl || !appUrl) {
  globalThis.console.error("PUBLIC_API_URL and PUBLIC_APP_URL are required.");
  process.exit(1);
}

const checks = [];

async function check(name, operation) {
  try {
    const details = await operation();
    checks.push({ name, success: true, details });
  } catch (error) {
    checks.push({ name, success: false, error: error.message });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

await check("Backend health", async () => {
  const response = await fetch(`${apiUrl}/api/v1/health`, {
    headers: { Accept: "application/json" },
  });
  assert(response.ok, `Expected HTTP 200, received ${response.status}.`);
  const body = await response.json();
  assert(body.success === true, "Health response success flag is not true.");
  return { status: response.status, requestId: body.requestId ?? null };
});

await check("Frontend root", async () => {
  const response = await fetch(appUrl, { redirect: "follow" });
  assert(response.ok, `Expected HTTP 200, received ${response.status}.`);
  assert(
    response.headers.get("content-type")?.includes("text/html"),
    "Frontend root did not return HTML.",
  );
  return { status: response.status };
});

await check("SPA deep-link rewrite", async () => {
  const response = await fetch(`${appUrl}/leaderboards`, { redirect: "follow" });
  assert(response.ok, `Expected HTTP 200, received ${response.status}.`);
  const text = await response.text();
  assert(
    text.includes('<div id="root"></div>'),
    "SPA index document was not returned.",
  );
  return { status: response.status };
});

await check("Credentialed CORS preflight", async () => {
  const response = await fetch(`${apiUrl}/api/auth/get-session`, {
    method: "OPTIONS",
    headers: {
      Origin: appUrl,
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  assert(
    response.ok || response.status === 204,
    `CORS preflight returned ${response.status}.`,
  );
  assert(
    response.headers.get("access-control-allow-origin") === appUrl,
    "Access-Control-Allow-Origin does not match the frontend URL.",
  );
  assert(
    response.headers.get("access-control-allow-credentials") === "true",
    "Credentialed CORS is not enabled.",
  );
  return { status: response.status };
});

globalThis.console.log(JSON.stringify({ checks }, null, 2));

if (checks.some((item) => !item.success)) {
  process.exitCode = 1;
}
