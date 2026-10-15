import { prepareSupport } from './source_support.mjs';
import { prepareTours } from './guided_tours.mjs';
import { orderedGraphRecords } from './graph_layout.mjs';

// Structural checks complement DIPL schemas; they never infer new claims.
export function validateOntology(data) {
  const fail = message => { throw new Error(`Ontology: ${message}`); };
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const { concepts, edges, relations, sources, study_areas, passion_profiles } = data.ontology;
  for (const [name, records] of Object.entries({concepts, edges, relations, sources, study_areas, passion_profiles})) {
    if (!records || typeof records !== 'object' || Array.isArray(records)) fail(`missing collection ${name}`);
  }
  const fields = (id, record, names) => {
    if (!text(id) || names.some(name => !text(record[name]))) fail(`incomplete definition ${id}`);
  };
  const source = (id, record) => { if (!sources[record.source_id]) fail(`unknown source for ${id}`); };
  for (const [id, record] of Object.entries(sources)) fields(id, record, ['author', 'work', 'locator', 'url']);
  for (const [id, area] of Object.entries(study_areas)) {
    fields(id, area, ['label', 'latin_name', 'description', 'classification_note']);
    source(id, area);
    if (area.evidence_kind !== 'editorial_classification') fail(`non-editorial study area ${id}`);
  }
  for (const [id, concept] of Object.entries(concepts)) {
    fields(id, concept, ['label', 'latin_name', 'note']);
    source(id, concept);
    const areas = concept.study_areas;
    if (!Array.isArray(areas) || !areas.length || new Set(areas).size !== areas.length || areas.some(area => !study_areas[area])) fail(`invalid study areas for ${id}`);
  }
  for (const [id, relation] of Object.entries(relations)) {
    fields(id, relation, ['label', 'description']);
    if (relation.principle_id != null && !concepts[relation.principle_id]) fail(`unknown principle for ${id}`);
    if (relation.explanation_role != null && !['context', 'capacity', 'effect', 'limit'].includes(relation.explanation_role)) fail(`invalid explanation role for ${id}`);
    if (relation.prose_template != null) {
      const template = relation.prose_template;
      if (!template.includes('{subject}') || !template.includes('{object}') || /[{}]/.test(template.replaceAll('{subject}', '').replaceAll('{object}', ''))) fail(`invalid prose template for ${id}`);
    }
  }
  for (const [id, edge] of Object.entries(edges)) {
    if (!concepts[edge.subject] || !concepts[edge.object]) fail(`unknown endpoint for ${id}`);
    if (!relations[edge.relation]) fail(`unknown relation for ${id}`);
    if (edge.relation === 'creates' && edge.subject !== 'god') fail(`only God may create: ${id}`);
    source(id, edge);
    if ((edge.conditions != null) !== (edge.condition_source_id != null) ||
        (edge.conditions != null && (!text(edge.conditions) || !sources[edge.condition_source_id]))) fail(`invalid condition citation for ${id}`);
    if (!text(data.rationales?.[id])) fail(`missing rationale for ${id}`);
  }
  for (const [id, profile] of Object.entries(passion_profiles)) {
    if (profile.concept_id !== id || concepts[id]?.category !== 'passion' || !concepts[profile.appetite_id]) fail(`invalid passion profile ${id}`);
    source(id, profile);
    if (!text(data.profile_rationales?.[id])) fail(`missing passion rationale for ${id}`);
    if (!Object.values(edges).some(edge => edge.subject === id && edge.relation === 'is_passion_of' && edge.object === profile.appetite_id)) fail(`passion appetite disagrees with edges: ${id}`);
  }
  for (const [rationales, records] of [[data.rationales, edges], [data.profile_rationales, passion_profiles]]) {
    for (const id of Object.keys(rationales || {})) if (!records[id]) fail(`orphan rationale ${id}`);
  }
  const styles = data.graph_concept_styles;
  if (!styles || Object.keys(styles).length !== Object.keys(concepts).length || Object.keys(concepts).some(id => !styles[id])) fail('each concept needs one color style');
  for (const palette of [styles, data.graph_relation_colors]) {
    if (!palette) fail('missing color palette');
    for (const [id, entry] of Object.entries(palette)) if (!/^#[0-9a-fA-F]{6}$/.test(entry.color) || !text(entry.metadata?.category)) fail(`invalid color metadata for ${id}`);
  }
  for (const [id, relation] of Object.entries(relations)) if (!data.graph_relation_colors[relation.kind]) fail(`missing relation color for ${id}`);
  if (!data.graph_viewer?.default) fail('missing viewer settings');
  orderedGraphRecords(data);
  prepareSupport(data);
  prepareTours(data);
  return data;
}
