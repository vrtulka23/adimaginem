// Explicit DIPL positions survive map sorting and lexicographic list exports.
export function orderedGraphRecords(data) {
  const ordered = (name, records) => {
    const entries = data.graph_layout?.[name];
    if (!Array.isArray(entries) || entries.length !== Object.keys(records).length) {
      throw new Error(`Layout: ${name} must list every ID exactly once`);
    }
    const positions = entries.map(entry => entry?.position);
    if (positions.some(position => !Number.isSafeInteger(position) || position < 0) ||
        new Set(positions).size !== positions.length) {
      throw new Error(`Layout: ${name} needs unique nonnegative integer positions`);
    }
    const ids = [...entries].sort((a, b) => a.position - b.position).map(entry => entry?.id);
    if (new Set(ids).size !== ids.length || ids.some(id => !Object.hasOwn(records, id))) {
      throw new Error(`Layout: ${name} contains duplicate or unknown IDs`);
    }
    return Object.fromEntries(ids.map(id => [id, records[id]]));
  };
  return {
    concepts: ordered('concept_order', data.ontology.concepts),
    edges: ordered('edge_order', data.ontology.edges),
  };
}
