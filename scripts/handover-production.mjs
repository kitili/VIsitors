const BASE = process.env.PRODUCTION_URL || "https://v-isitors.vercel.app";

async function req(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, options);
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: response.status, body, ok: response.ok };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log(`Production handover test → ${BASE}\n`);

  const home = await fetch(BASE);
  assert(home.ok, `Home page returned ${home.status}`);

  const health = await req("/api/health");
  assert(health.body.ok, `Database unhealthy: ${JSON.stringify(health.body)}`);
  console.log(`✓ Database: ${health.body.database} (${health.body.visits} visits)`);

  const checkInUrl = await req("/api/check-in-url");
  assert(checkInUrl.body.url?.startsWith(BASE), `QR URL wrong: ${checkInUrl.body.url}`);
  console.log(`✓ QR check-in URL: ${checkInUrl.body.url}`);

  const visit = await req("/api/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Production Handover Test",
      phone: "0754999001",
      purpose: "Parent meeting",
      host: "Front Office",
      campus: "Kijenge",
      source: "self",
    }),
  });
  assert(visit.status === 201, `Sign-in failed: ${JSON.stringify(visit.body)}`);
  console.log(`✓ Sign-in works (id: ${visit.body.visit.id})`);

  const history = await req("/api/visits?campus=Kijenge&dateFrom=2020-01-01&dateTo=2099-12-31");
  assert(history.body.visits?.length > 0, "History query returned no rows");
  console.log(`✓ History: ${history.body.visits.length} visits for Kijenge`);

  if (health.body.database === "sqlite") {
    console.log("\n⚠ Using temporary SQLite on Vercel — add Turso for persistent storage.");
    console.log("  Run: npm run setup:turso");
  } else {
    console.log("\n✓ Turso remote database connected.");
  }

  console.log("\nProduction handover test passed.");
}

main().catch((error) => {
  console.error("FAILED:", error.message);
  process.exit(1);
});
