import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [directory, expectedFile] = process.argv.slice(2);
if (!directory || !expectedFile) throw new Error("Usage: node verify_web_parity.mjs STATIC_DIRECTORY PYTHON_BASELINE");
const site = resolve(directory);
const { loadDIPL } = await import(pathToFileURL(`${site}/snt-web/index.mjs`));
const { readViewerData } = await import(pathToFileURL(`${site}/web_ontology_adapter.mjs`));
const expected = JSON.parse(readFileSync(expectedFile, "utf8"));
const bundle = JSON.parse(readFileSync(`${site}/ontology.bundle.json`, "utf8"));
const started = performance.now();
const runtime = await loadDIPL();
const model = runtime.parseBundle(bundle);
try {
  const actual = readViewerData(model, (done, total) => {
    if (done % 1000 === 1) console.log(`Inspecting ${done}/${total} DIPL paths`);
  });
  const differences = [];
  function compare(a, b, path) {
    if (a !== null && b !== null && typeof a === "object" && typeof b === "object") {
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      for (const key of keys) compare(a[key], b[key], `${path}.${key}`);
    } else if (!Object.is(a, b)) differences.push({ path, python: a, web: b });
  }
  compare(expected, actual, "data");
  if (differences.length) throw new Error(`${differences.length} parity differences: ${JSON.stringify(differences.slice(0, 20))}`);
  console.log(JSON.stringify({ parity: "exact", concepts: Object.keys(actual.ontology.concepts).length,
    edges: Object.keys(actual.ontology.edges).length, rationales: Object.keys(actual.rationales).length,
    seconds: Math.round((performance.now() - started) / 100) / 10 }));
} finally { model.dispose(); }
