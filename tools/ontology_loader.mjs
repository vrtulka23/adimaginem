// The native server supplies this endpoint explicitly. Static builds omit it.
export async function loadOntology(progress = () => {}) {
  const endpoint = document.querySelector('meta[name="ontology-endpoint"]')?.content;
  if (endpoint) {
    progress("Loading ontology from the local Python server…");
    const response = await fetch(new URL(endpoint, document.baseURI));
    if (!response.ok) throw new Error(`Python ontology request failed: ${response.status}`);
    return response.json();
  }
  const { loadWebOntology } = await import("./web_ontology_loader.mjs");
  return loadWebOntology(progress);
}
