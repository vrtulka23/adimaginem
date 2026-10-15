// Both delivery modes use the same data contract and browser validation.
import { validateOntology } from "./ontology_validation.mjs";

export async function loadOntology(progress = () => {}) {
  const endpoint = document.querySelector('meta[name="ontology-endpoint"]')?.content;
  if (!endpoint) throw new Error("Missing ontology data endpoint");
  progress("Loading the cited ontology…");
  const response = await fetch(new URL(endpoint, document.baseURI));
  if (!response.ok) throw new Error(`Ontology request failed: ${response.status}`);
  const data = await response.json();
  validateOntology(data);
  return data;
}
