import { execSync } from "child_process";

const TERMS_URL =
  "https://vercel.com/mourinekitilimourine-8096s-projects/~/integrations/accept-terms/tursocloud";

function run(command) {
  return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function parseJson(output) {
  try {
    return JSON.parse(output);
  } catch {
    return null;
  }
}

async function checkProductionHealth() {
  const base = process.env.PRODUCTION_URL || "https://v-isitors.vercel.app";
  const response = await fetch(`${base}/api/health`);
  return response.json();
}

async function main() {
  console.log("Provisioning Turso for v-isitors on Vercel\n");

  let installOutput = "";
  try {
    installOutput = run(
      "vercel integration add tursocloud/database -n silverleaf-visitors -m region=iad1 --plan starter -e production --format=json",
    );
  } catch (error) {
    const stdout = error.stdout?.toString?.() ?? "";
    const stderr = error.stderr?.toString?.() ?? "";
    installOutput = stdout || stderr;
  }

  const payload = parseJson(installOutput);
  if (payload?.status === "action_required") {
    console.error("Turso terms must be accepted before provisioning can finish.\n");
    console.error(`1. Open: ${payload.verification_uri || TERMS_URL}`);
    console.error("2. Accept Turso marketplace terms in your browser.");
    console.error("3. Re-run: npm run provision:turso\n");
    process.exit(1);
  }

  if (!payload || payload.status === "error") {
    console.error(installOutput || "Turso install did not return success JSON.");
    console.error(`If terms are not accepted yet, open: ${TERMS_URL}`);
    process.exit(1);
  }

  console.log("Turso resource provisioned. Redeploying production…");
  run("vercel --prod --yes");

  const health = await checkProductionHealth();
  if (health.persistent) {
    console.log("\n✓ Turso connected. Production database is persistent.");
    console.log(`  Visits in database: ${health.visits}`);
    return;
  }

  console.error("\nDeploy finished but production is still using temporary SQLite.");
  console.error("Check Vercel → v-isitors → Settings → Environment Variables for:");
  console.error("  TURSO_DATABASE_URL");
  console.error("  TURSO_AUTH_TOKEN");
  process.exit(1);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
