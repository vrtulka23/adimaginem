// Adapt SNT's evaluated values and metadata to the existing viewer contract.
// This does not parse DIPL source; SNT's WebAssembly runtime owns evaluation.
export function decodeScalar(description) {
  if (description.kind !== "value") {
    if (description.valueUnavailableReason === "not_a_value") return undefined;
    throw new Error(`Cannot read ${description.path}: ${description.valueUnavailableReason}`);
  }
  if (description.valueText === null || description.shape.length || description.units) {
    throw new Error(`Unsupported or omitted viewer value: ${description.path}`);
  }
  const value = JSON.parse(description.valueText);
  const type = description.storedType;
  if (type === "str" && typeof value === "string") return value;
  if (type === "bool" && typeof value === "boolean") return value;
  if (type === "float64" && typeof value === "number" && Number.isFinite(value)) return value;
  if (type === "int64" && Number.isSafeInteger(value)) return value;
  throw new Error(`Unsupported or imprecise ${type} value at ${description.path}`);
}

export function readViewerData(model, progress = () => {}) {
  const data = { ontology: {}, rationales: {}, profile_rationales: {},
    graph_viewer: {}, graph_concept_styles: {}, graph_relation_colors: {} };
  const paths = model.paths().filter(path => /^(ontology\.|graph_viewer\[|graph_concept_styles\[|graph_relation_colors\[)/.test(path));
  paths.forEach((path, index) => {
    const description = model.describe(path);
    const value = decodeScalar(description);
    if (value !== undefined) {
      // The viewer's DIPL schemas use named records with scalar fields.
      const match = /^(ontology\.([a-z_]+)|graph_viewer|graph_concept_styles|graph_relation_colors)\[([a-z_0-9]+)\]\.([a-z_0-9]+)$/.exec(path);
      if (!match) throw new Error(`Unsupported viewer path: ${path}`);
      const [, root, collection, id, field] = match;
      const records = collection ? (data.ontology[collection] ||= {}) : data[root];
      const record = records[id] ||= {};
      record[field] = value;
      if (collection === "edges" && field === "source_id") data.rationales[id] = description.metadata.rationale;
      if (collection === "passion_profiles" && field === "source_id") data.profile_rationales[id] = description.metadata.rationale;
      if ((root === "graph_concept_styles" || root === "graph_relation_colors") && field === "color") {
        if (!description.metadata.category || !/^#[0-9a-fA-F]{6}$/.test(value)) throw new Error(`Invalid color or category at ${path}`);
        record.metadata = { category: description.metadata.category };
      }
    }
    if (index % 100 === 0 || index === paths.length - 1) progress(index + 1, paths.length);
  });
  for (const key of ["concepts", "edges", "relations", "sources", "passion_profiles"]) {
    if (!data.ontology[key]) throw new Error(`Missing ontology collection: ${key}`);
  }
  const expected = Object.keys(data.ontology.concepts).sort();
  if (JSON.stringify(expected) !== JSON.stringify(Object.keys(data.graph_concept_styles).sort())) {
    throw new Error("Every ontology concept needs exactly one graph_concept_styles entry");
  }
  return data;
}
