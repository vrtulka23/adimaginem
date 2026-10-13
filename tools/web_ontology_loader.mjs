export function loadWebOntology(progress = () => {}) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./web_ontology_worker.mjs", import.meta.url), { type: "module" });
    worker.onmessage = ({ data }) => {
      if (data.type === "progress") progress(data.message);
      else {
        worker.terminate();
        if (data.type === "result") resolve(data.data);
        else reject(new Error(data.message || "SNT worker failed"));
      }
    };
    worker.onerror = event => {
      worker.terminate();
      reject(new Error(event.message || "Unable to start the SNT WebAssembly worker"));
    };
  });
}
