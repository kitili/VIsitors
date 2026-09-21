const BASE = process.env.BASE || "http://127.0.0.1:3108";
const fresh = process.argv.includes("--fresh");

const visitors = [
  {
    name: "Amina Joseph",
    phone: "0754123456",
    purpose: "Official Office visit",
    host: "Erick Anthony",
    campus: "Usa River",
    source: "self",
  },
  {
    name: "James Mwangi",
    phone: "0754987654",
    purpose: "Student admission inquiry",
    host: "Admissions Office",
    campus: "Arusha Modern",
    source: "self",
  },
  {
    name: "Grace Kimaro",
    phone: "0754111222",
    purpose: "Picking up student",
    host: "Front Office",
    campus: "Kijenge",
    source: "desk",
  },
  {
    name: "Peter Ole Sanare",
    phone: "0754333444",
    purpose: "Dropping off Student",
    host: "HR Office",
    campus: "Ilboru",
    source: "desk",
  },
  {
    name: "Fatuma Hassan",
    phone: "0754555666",
    purpose: "Student visiting day",
    host: "Facilities",
    campus: "Boma",
    source: "self",
  },
  {
    name: "David Mrosso",
    phone: "0754777888",
    purpose: "Event attendance",
    host: "Year 3 Teacher",
    campus: "Usa River",
    source: "desk",
  },
];

async function req(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, options);
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

function seedKey(visitor) {
  return `${visitor.name}::${visitor.campus}`;
}

async function main() {
  if (!fresh) {
    const existing = await req("/api/visits");
    const rows = existing.body.visits ?? [];
    const keys = new Set(visitors.map(seedKey));
    const matches = rows.filter((row) => keys.has(`${row.name}::${row.campus}`));
    if (matches.length >= visitors.length) {
      console.log(`Seed data already present (${matches.length} visitors). Use --fresh to add again.`);
      return;
    }
  }

  let created = 0;
  for (const visitor of visitors) {
    const result = await req("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visitor),
    });
    if (result.status === 201) {
      created += 1;
      console.log(`+ ${visitor.name} @ ${visitor.campus}`);
    } else {
      console.warn(`! ${visitor.name}: ${result.body.error || result.status}`);
    }
  }
  console.log(`Seeded ${created} visitors.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
