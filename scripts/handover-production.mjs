const BASE = process.env.PRODUCTION_URL || "https://v-isitors.vercel.app";
const TZ = "Africa/Dar_es_Salaam";

function localDateKey(at = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

async function req(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, options);
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: response.status, body, ok: response.ok, headers: response.headers };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertHistoryContains({ campus, visitId, dateFrom, dateTo, label }) {
  const query = new URLSearchParams({ campus, dateFrom, dateTo });
  const history = await req(`/api/visits?${query.toString()}`);
  assert(history.status === 200, `${label}: history query failed`);
  assert(
    history.body.visits?.some((row) => row.id === visitId),
    `${label}: visit ${visitId} not found for ${campus} (${dateFrom} → ${dateTo})`,
  );
}

async function main() {
  const today = localDateKey();
  console.log(`Production handover test → ${BASE} (today: ${today})\n`);

  const home = await fetch(BASE);
  assert(home.ok, `Home page returned ${home.status}`);

  const health = await req("/api/health");
  assert(health.body.ok, `Database unhealthy: ${JSON.stringify(health.body)}`);
  console.log(`✓ Database: ${health.body.database} (${health.body.visits} visits)`);

  const checkInUrl = await req("/api/check-in-url");
  assert(checkInUrl.body.url?.startsWith("http"), `QR URL wrong: ${checkInUrl.body.url}`);
  console.log(`✓ QR check-in URL: ${checkInUrl.body.url}`);

  const qr = await fetch(`${BASE}/api/qr`);
  assert(qr.ok, `QR endpoint failed (${qr.status})`);
  assert(qr.headers.get("x-check-in-url")?.includes("check-in"), "QR missing check-in URL header");
  console.log("✓ QR image endpoint works");

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

  await assertHistoryContains({
    campus: "Kijenge",
    visitId: visit.body.visit.id,
    dateFrom: today,
    dateTo: today,
    label: "Today's history",
  });

  const history = await req("/api/visits?campus=Kijenge&dateFrom=2020-01-01&dateTo=2099-12-31");
  assert(history.body.visits?.length > 0, "Full history query returned no rows");
  assert(
    history.body.visits.some((row) => row.id === visit.body.visit.id),
    "Full history missing the visit just created",
  );
  console.log(`✓ History: ${history.body.visits.length} visits for Kijenge (includes new sign-in)`);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await assertHistoryContains({
      campus: "Kijenge",
      visitId: visit.body.visit.id,
      dateFrom: today,
      dateTo: today,
      label: `Live history refresh ${attempt}`,
    });
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 400));
  }
  console.log("✓ History stays readable across repeated refreshes");

  const historyPage = await fetch(`${BASE}/campus/kijenge/history`);
  assert(historyPage.ok, `History page returned ${historyPage.status}`);
  const historyHtml = await historyPage.text();
  assert(historyHtml.includes("Visit history"), "History page missing title");
  assert(historyHtml.includes("Visitor"), "History page missing table headers");
  console.log("✓ History page loads with expected content");

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
