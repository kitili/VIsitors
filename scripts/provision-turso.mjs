import { execSync } from "child_process";

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
  console.log("Provisioning Neon Postgres for v-isitors on Vercel\n");

  let installOutput = "";
  try {
    installOutput = run(
      "vercel integration add neon/neon -n silverleaf-visitors -e production --format=json",
    );
  } catch (error) {
    const stdout = error.stdout?.toString?.() ?? "";
    const stderr = error.stderr?.toString?.() ?? "";
    installOutput = stdout || stderr;
  }

  const payload = parseJson(installOutput);
  if (!payload?.resource?.id && payload?.status !== "ready") {
    console.error(installOutput || "Neon install did not return success JSON.");
    process.exit(1);
  }

  console.log("Neon resource provisioned. Redeploying production…");
  run("vercel --prod --yes");

  const health = await checkProductionHealth();
  if (health.persistent) {
    console.log("\n✓ Neon connected. Production database is persistent.");
    console.log(`  Database: ${health.database}`);
    console.log(`  Visits in database: ${health.visits}`);
    return;
  }

  console.error("\nDeploy finished but production is still using temporary SQLite.");
  console.error("Check Vercel → v-isitors → Settings → Environment Variables for DATABASE_URL.");
  process.exit(1);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
