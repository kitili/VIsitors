const BASE = process.env.SMOKE_BASE || "http://localhost:3108";
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
  if (!condition) {
    throw new Error(message);
  }
}

function visitInList(visits, id) {
  return Array.isArray(visits) && visits.some((visit) => visit.id === id);
}

async function assertHistoryContains({
  campus,
  visitId,
  dateFrom,
  dateTo,
  label,
  expectSignedOut,
}) {
  const query = new URLSearchParams({ campus, dateFrom, dateTo });
  const history = await req(`/api/visits?${query.toString()}`);
  assert(history.status === 200, `${label}: history query failed (${history.status})`);
  assert(
    visitInList(history.body.visits, visitId),
    `${label}: visit ${visitId} missing from ${campus} history (${dateFrom} → ${dateTo})`,
  );
  if (expectSignedOut !== undefined) {
    const row = history.body.visits.find((visit) => visit.id === visitId);
    assert(
      Boolean(row?.signedOutAt) === expectSignedOut,
      `${label}: expected signedOut=${expectSignedOut}, got ${row?.signedOutAt ?? "null"}`,
    );
  }
  return history.body.visits.find((visit) => visit.id === visitId);
}

async function assertLiveHistoryRefresh({ campus, visitId, dateFrom, dateTo }) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await assertHistoryContains({
      campus,
      visitId,
      dateFrom,
      dateTo,
      label: `Live refresh attempt ${attempt}`,
    });
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
}

const TINY_JPEG =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBAQEBAVFRUVFRUVFRUVFRUXFxUXFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAXAAEBAQEAAAAAAAAAAAAAAAAAAQIF/8QAFhEBAQEAAAAAAAAAAAAAAAAAAAER/9oADAMBAAIQAxAAAAGmP//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z";

async function main() {
  const today = localDateKey();
  console.log(`Smoke test → ${BASE} (today: ${today}, ${TZ})\n`);

  const health = await fetch(BASE);
  assert(health.ok, `App is not running at ${BASE}. Start it with npm run dev.`);

  const rejected = await req("/api/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test Visitor",
      phone: "07AB400000",
      purpose: "Interview",
      host: "Front Office",
      campus: "Usa River",
      source: "desk",
    }),
  });
  assert(rejected.status === 400, `Expected digits-only rejection, got ${rejected.status}`);

  const deskVisit = await req("/api/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Desk Visitor",
      phone: "0754111222",
      purpose: "Parent meeting",
      host: "Front Office",
      campus: "Usa River",
      source: "desk",
      photo: TINY_JPEG,
    }),
  });
  assert(deskVisit.status === 201, `Desk sign-in failed: ${JSON.stringify(deskVisit.body)}`);
  assert(deskVisit.body.visit.photo?.startsWith("/api/photos/"), "Photo was not stored as file URL");

  const photo = await fetch(`${BASE}${deskVisit.body.visit.photo}`);
  assert(photo.ok, "Stored photo is not readable");

  await assertHistoryContains({
    campus: "Usa River",
    visitId: deskVisit.body.visit.id,
    dateFrom: today,
    dateTo: today,
    label: "Desk visitor in today's history",
    expectSignedOut: false,
  });
  await assertLiveHistoryRefresh({
    campus: "Usa River",
    visitId: deskVisit.body.visit.id,
    dateFrom: today,
    dateTo: today,
  });

  const selfVisit = await req("/api/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Amina Joseph",
      phone: "0754000000",
      purpose: "Prospective family tour",
      host: "Admissions",
      campus: "Kijenge",
      source: "self",
    }),
  });
  assert(selfVisit.status === 201, `Self check-in failed: ${JSON.stringify(selfVisit.body)}`);

  await assertHistoryContains({
    campus: "Kijenge",
    visitId: selfVisit.body.visit.id,
    dateFrom: today,
    dateTo: today,
    label: "Self visitor in today's history",
    expectSignedOut: false,
  });

  const lookup = await req("/api/visits/lookup?phone=0754111222");
  assert(lookup.status === 200, "Phone lookup failed");
  assert(lookup.body.visit?.name === "Desk Visitor", "Lookup did not return last visit");

  const overview = await req("/api/overview");
  assert(overview.status === 200, "Overview failed");
  assert(Array.isArray(overview.body.campuses), "Overview missing campuses");
  assert(overview.body.campuses.length === 5, "Overview should include 5 campuses");
  const usaRiverOverview = overview.body.campuses.find((campus) => campus.name === "Usa River");
  assert(usaRiverOverview?.onSite >= 1, "Overview should show Usa River visitors on site");

  const search = await req("/api/visits?campus=Usa%20River&search=Desk");
  assert(search.status === 200, "Search failed");
  assert(
    search.body.visits.some((visit) => visit.id === deskVisit.body.visit.id),
    "Search did not find desk visitor by id",
  );

  const watchlistAdd = await req("/api/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: "0754999999",
      reason: "Smoke test blocked person",
    }),
  });
  assert(watchlistAdd.status === 201, "Watchlist add failed");

  const blocked = await req("/api/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Blocked Person",
      phone: "0754999999",
      purpose: "Interview",
      host: "Front Office",
      campus: "Usa River",
      source: "desk",
    }),
  });
  assert(blocked.status === 400, "Watchlist should block sign-in");

  await req(`/api/watchlist/${watchlistAdd.body.entry.id}`, { method: "DELETE" });

  const listed = await req(`/api/visits?campus=Usa%20River&date=${today}&onSite=1`);
  assert(listed.status === 200, "Campus on-site list failed");
  assert(
    listed.body.visits.some((visit) => visit.id === deskVisit.body.visit.id),
    "Desk visitor missing from today's on-site list",
  );

  const checkOut = await req("/api/visits/check-out", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "0754111222", campus: "Usa River" }),
  });
  assert(checkOut.status === 200, "Self check-out failed");
  assert(checkOut.body.visit.signedOutAt, "Check-out did not set signedOutAt");

  await assertHistoryContains({
    campus: "Usa River",
    visitId: deskVisit.body.visit.id,
    dateFrom: today,
    dateTo: today,
    label: "Desk visitor after check-out",
    expectSignedOut: true,
  });

  const afterCheckOutOnSite = await req(`/api/visits?campus=Usa%20River&date=${today}&onSite=1`);
  assert(
    !visitInList(afterCheckOutOnSite.body.visits, deskVisit.body.visit.id),
    "Checked-out desk visitor should not remain on site",
  );

  const bulkVisit = await req("/api/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Bulk Sign Out Visitor",
      phone: "0754222333",
      purpose: "Delivery / vendor",
      host: "Front Office",
      campus: "Usa River",
      source: "desk",
    }),
  });
  assert(bulkVisit.status === 201, `Bulk test sign-in failed: ${JSON.stringify(bulkVisit.body)}`);

  const signOutAll = await req("/api/visits/sign-out-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campus: "Usa River" }),
  });
  assert(signOutAll.status === 200, "Sign-out-all failed");
  assert(signOutAll.body.count >= 1, "Sign-out-all should sign out at least one visitor");

  const patchSignOut = await req(`/api/visits/${selfVisit.body.visit.id}`, { method: "PATCH" });
  assert(patchSignOut.status === 200, "PATCH sign-out failed");
  assert(patchSignOut.body.visit.signedOutAt, "PATCH sign-out did not set signedOutAt");

  const history = await req(
    `/api/visits?campus=Usa%20River&dateFrom=2020-01-01&dateTo=2099-12-31`,
  );
  assert(history.status === 200, "Full history query failed");
  assert(
    history.body.visits.some((visit) => visit.id === deskVisit.body.visit.id),
    "Full history missing desk visitor",
  );

  const historyFilter = await req(
    `/api/visits?campus=Usa%20River&dateFrom=${today}&dateTo=${today}&search=Desk`,
  );
  assert(historyFilter.status === 200, "Today's history search filter failed");
  assert(
    historyFilter.body.visits.some((visit) => visit.id === deskVisit.body.visit.id),
    "Today's history search did not return desk visitor",
  );

  const kijengeHistory = await req(
    `/api/visits?campus=Kijenge&dateFrom=${today}&dateTo=${today}`,
  );
  assert(
    visitInList(kijengeHistory.body.visits, selfVisit.body.visit.id),
    "Kijenge today's history missing self visitor",
  );

  const exportCsv = await fetch(
    `${BASE}/api/visits/export?campus=Usa%20River&dateFrom=${today}&dateTo=${today}`,
  );
  assert(exportCsv.ok, `CSV export failed (${exportCsv.status})`);
  const csv = await exportCsv.text();
  assert(csv.includes("Desk Visitor"), "CSV export missing desk visitor");
  assert(csv.includes("Signed in"), "CSV export missing headers");

  const checkInUrl = await req("/api/check-in-url");
  assert(checkInUrl.status === 200, "Check-in URL endpoint failed");
  assert(checkInUrl.body.url?.includes("/check-in"), "Check-in URL missing /check-in path");

  const qr = await fetch(`${BASE}/api/qr?campus=kijenge`);
  assert(qr.ok, `QR endpoint failed (${qr.status})`);
  assert(qr.headers.get("content-type")?.includes("image/png"), "QR did not return PNG");
  assert(qr.headers.get("x-check-in-url")?.includes("check-in"), "QR missing check-in URL header");

  const dbHealth = await req("/api/health");
  assert(dbHealth.status === 200 && dbHealth.body.ok, "Database health check failed");
  assert(dbHealth.body.visits >= 3, "Database should contain smoke-test visits");

  const pages = [
    { path: "/", mustInclude: ["Silverleaf"] },
    { path: "/overview", mustInclude: ["Silverleaf", "Network overview", "Live visitor counts"] },
    { path: "/check-out", mustInclude: ["Silverleaf", "Check out"] },
    { path: "/campus/usa-river", mustInclude: ["Silverleaf", "Visitor Log"] },
    {
      path: "/campus/usa-river/history",
      mustInclude: ["Silverleaf", "Visit history", "Visitor", "Purpose", "Refresh now"],
    },
    { path: "/campus/kijenge/qr", mustInclude: ["Silverleaf", "QR check-in poster"] },
    { path: "/check-in", mustInclude: ["Silverleaf", "visitor check-in"] },
    { path: "/qr", mustInclude: ["Visitor self check-in"] },
  ];

  for (const page of pages) {
    const response = await fetch(`${BASE}${page.path}`);
    assert(response.ok, `${page.path} returned ${response.status}`);
    const html = await response.text();
    for (const text of page.mustInclude) {
      assert(html.includes(text), `${page.path} is missing "${text}"`);
    }
  }

  console.log(
    "Smoke test passed: history (today + live refresh), overview, search, lookup, watchlist, check-out, sign-out-all, export, QR, pages.",
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
