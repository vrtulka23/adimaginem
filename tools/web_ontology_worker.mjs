import { loadDIPL } from "./snt-web/index.mjs";
import { readViewerData } from "./web_ontology_adapter.mjs";

let model;
try {
  self.postMessage({ type: "progress", message: "Loading SNT WebAssembly and DIPL sources…" });
  const [runtime, response] = await Promise.all([
    loadDIPL(), fetch(new URL("./ontology.bundle.json", import.meta.url)),
  ]);
  if (!response.ok) throw new Error(`DIPL bundle request failed: ${response.status}`);
  const bundle = await response.json();
  self.postMessage({ type: "progress", message: "Evaluating DIPL with SNT…" });
  model = runtime.parseBundle(bundle);
  const data = readViewerData(model, (done, total) => {
    self.postMessage({ type: "progress", message: `Reading ontology and metadata: ${done} / ${total}…` });
  });
  self.postMessage({ type: "result", data });
} catch (error) {
  self.postMessage({ type: "error", message: error?.message || String(error) });
} finally {
  model?.dispose();
}
