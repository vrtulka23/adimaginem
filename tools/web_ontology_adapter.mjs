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

export function decodeViewerValue(description) {
  if (description.kind === "value" && description.shape.length) {
    if (description.storedType === "str" && description.shape.length === 1 && !description.units && description.valueText !== null) {
      let value = JSON.parse(description.valueText);
      // SNT keeps shape [1] but renders the single element without brackets.
      if (description.shape[0] === 1 && typeof value === "string") value = [value];
      if (Array.isArray(value) && value.length === description.shape[0] && value.every(item => typeof item === "string")) return value;
    }
    throw new Error(`Unsupported or omitted viewer array: ${description.path}`);
  }
  return decodeScalar(description);
}

export function readViewerData(model, progress = () => {}) {
  const data = { ontology: {}, rationales: {}, profile_rationales: {}, support_rationales: {},
    graph_viewer: {}, graph_concept_styles: {}, graph_relation_colors: {},
    graph_tours: {}, graph_tour_steps: {}, graph_tour_positions: {} };
  const paths = model.paths().filter(path => /^(ontology\.|graph_viewer\[|graph_concept_styles\[|graph_relation_colors\[|graph_tours\[|graph_tour_steps\[|graph_tour_positions\[)/.test(path));
  paths.forEach((path, index) => {
    const description = model.describe(path);
    const value = decodeViewerValue(description);
    if (value !== undefined) {
      // Named records have scalar fields and one-dimensional string arrays.
      const match = /^(ontology\.([a-z_]+)|graph_viewer|graph_concept_styles|graph_relation_colors|graph_tours|graph_tour_steps|graph_tour_positions)\[([a-z_0-9]+)\]\.([a-z_0-9]+)$/.exec(path);
      if (!match) throw new Error(`Unsupported viewer path: ${path}`);
      const [, root, collection, id, field] = match;
      const records = collection ? (data.ontology[collection] ||= {}) : data[root];
      const record = records[id] ||= {};
      record[field] = value;
      if (collection === "edges" && field === "source_id") data.rationales[id] = description.metadata.rationale;
      if (collection === "support_records" && field === "source_id") data.support_rationales[id] = description.metadata.rationale;
      if (collection === "passion_profiles" && field === "source_id") data.profile_rationales[id] = description.metadata.rationale;
      if ((root === "graph_concept_styles" || root === "graph_relation_colors") && field === "color") {
        if (!description.metadata.category || !/^#[0-9a-fA-F]{6}$/.test(value)) throw new Error(`Invalid color or category at ${path}`);
        record.metadata = { category: description.metadata.category };
      }
    }
    if (index % 100 === 0 || index === paths.length - 1) progress(index + 1, paths.length);
  });
  for (const key of ["concepts", "edges", "relations", "sources", "passion_profiles", "study_areas"]) {
    if (!data.ontology[key]) throw new Error(`Missing ontology collection: ${key}`);
  }
  for (const [id, concept] of Object.entries(data.ontology.concepts)) {
    if (!Array.isArray(concept.study_areas) || !concept.study_areas.length ||
        new Set(concept.study_areas).size !== concept.study_areas.length ||
        concept.study_areas.some(area => !data.ontology.study_areas[area])) {
      throw new Error(`Invalid study areas for concept ${id}`);
    }
  }
  const expected = Object.keys(data.ontology.concepts).sort();
  if (JSON.stringify(expected) !== JSON.stringify(Object.keys(data.graph_concept_styles).sort())) {
    throw new Error("Every ontology concept needs exactly one graph_concept_styles entry");
  }
  return data;
}
