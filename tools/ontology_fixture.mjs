export function fixture() {
  return {
    ontology: {
      sources: { text: { author: 'Author', work: 'Work', locator: 'Section 1', url: 'https://example.org/source', witness_kind: 'unassessed' } },
      study_areas: { philosophy: { label: 'Philosophy', latin_name: 'Philosophia', description: 'Study', classification_note: 'Editorial', evidence_kind: 'editorial_classification', source_id: 'text' } },
      concepts: {
        god: { label: 'God', latin_name: 'Deus', note: 'Creator', source_id: 'text', study_areas: ['philosophy'] },
        creature: { label: 'Creature', latin_name: 'Creatura', note: 'Created being', source_id: 'text', study_areas: ['philosophy'] },
      },
      relations: { creates: { label: 'Creates', description: 'Gives being', kind: 'creation', prose_template: '{subject} creates {object}.' } },
      edges: { creation: { subject: 'god', object: 'creature', relation: 'creates', source_id: 'text' } },
      passion_profiles: {}, support_records: {},
    },
    rationales: { creation: 'Cited claim' }, profile_rationales: {}, support_rationales: {},
    graph_viewer: { default: {} }, graph_tours: {}, graph_tour_steps: {}, graph_tour_positions: {},
    graph_layout: { concept_order: [{id: 'god', position: 0}, {id: 'creature', position: 1}], edge_order: [{id: 'creation', position: 0}] },
    graph_concept_styles: { god: { color: '#aabbcc', metadata: { category: 'God' } }, creature: { color: '#112233', metadata: { category: 'Creation' } } },
    graph_relation_colors: { creation: { color: '#aabbcc', metadata: { category: 'Creation' } } },
  };
}
