import { loadValidationEnv, createAdminClient } from "./validation-lib.mjs";

const env = loadValidationEnv();
const admin = createAdminClient(env);

const tables = [
  "cases",
  "priority_profiles",
  "priority_weights",
  "curated_selections",
  "curated_selection_options",
  "compatibility_analyses",
  "human_review_results",
  "curadoria_reports",
  "curadoria_report_options",
  "devolutiva_records",
  "patient_curadoria_decisions",
  "case_events",
];

for (const table of tables) {
  const { data, error } = await admin.schema("curadoria").from(table).select("*").limit(1);
  console.log(`\n=== curadoria.${table} ===`);
  if (error) {
    console.log("ERROR:", error.message);
    continue;
  }
  if (!data?.length) {
    console.log("(empty table)");
    continue;
  }
  console.log("columns:", Object.keys(data[0]).join(", "));
  console.log("sample:", JSON.stringify(data[0], null, 2));
}

console.log("\n=== ROW COUNTS ===");
for (const table of tables) {
  const { count, error } = await admin
    .schema("curadoria")
    .from(table)
    .select("*", { count: "exact", head: true });
  console.log(`${table}: ${error ? error.message : count}`);
}
