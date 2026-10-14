// Tour content and geometry are authored in DIPL. This module resolves IDs and
// rejects inconsistent scenes; it does not generate theological claims.
export function prepareTours(data) {
  const tours = data.graph_tours, steps = data.graph_tour_steps, positions = data.graph_tour_positions;
  const { concepts, edges, sources } = data.ontology;
  const fail = message => { throw new Error(`Guided tours: ${message}`); };
  const text = (value, label) => { if (typeof value !== 'string' || !value.trim()) fail(`missing ${label}`); };
  const list = (value, label) => {
    if (!Array.isArray(value) || !value.length || value.some(id => typeof id !== 'string' || !id.trim()) || new Set(value).size !== value.length) fail(`invalid ${label}`);
  };
  if (!tours || !steps || !positions) fail('missing catalogue, steps, or positions');
  const used = new Set(), scenes = {};
  for (const [id, tour] of Object.entries(tours)) {
    for (const field of ['title', 'description', 'framing_note']) text(tour[field], `${id}.${field}`);
    for (const field of ['audience_tags', 'topic_tags', 'step_ids']) list(tour[field], `${id}.${field}`);
    if (!['draft', 'reviewed', 'contested'].includes(tour.review_status)) fail(`invalid review status for ${id}`);
    for (const stepId of tour.step_ids) {
      if (used.has(stepId) || steps[stepId]?.tour_id !== id) fail(`invalid step ${stepId} in ${id}`);
      used.add(stepId);
    }
  }
  for (const [id, step] of Object.entries(steps)) {
    if (!used.has(id)) fail(`orphan step ${id}`);
    for (const field of ['title', 'question', 'narrative', 'qualification']) text(step[field], `${id}.${field}`);
    for (const field of ['source_ids', 'concept_ids', 'edge_ids', 'highlighted_concept_ids', 'highlighted_edge_ids']) list(step[field], `${id}.${field}`);
    if (step.source_ids.some(source => !sources[source])) fail(`unknown citation in ${id}`);
    if (step.concept_ids.some(concept => !concepts[concept])) fail(`unknown concept in ${id}`);
    if (!step.highlighted_concept_ids.includes(step.focus_concept)) fail(`focus outside highlighted concepts in ${id}`);
    if (step.highlighted_concept_ids.some(concept => !step.concept_ids.includes(concept))) fail(`highlighted concept outside scene ${id}`);
    if (step.highlighted_edge_ids.some(edge => !step.edge_ids.includes(edge))) fail(`highlighted edge outside scene ${id}`);
    for (const edgeId of step.edge_ids) {
      const edge = edges[edgeId];
      if (!edge || !step.concept_ids.includes(edge.subject) || !step.concept_ids.includes(edge.object)) fail(`edge ${edgeId} outside scene ${id}`);
    }
    const connected = new Set(step.highlighted_concept_ids);
    let changed = true;
    while (changed) {
      changed = false;
      for (const edgeId of step.edge_ids) {
        const {subject, object} = edges[edgeId];
        if (connected.has(subject) === connected.has(object)) continue;
        connected.add(subject); connected.add(object); changed = true;
      }
    }
    if (step.concept_ids.some(concept => !connected.has(concept))) fail(`supporting concept disconnected from highlighted concepts in ${id}`);
    const camera = ['camera_x', 'camera_y', 'camera_z'].map(field => step[field]);
    const target = ['look_at_x', 'look_at_y', 'look_at_z'].map(field => step[field]);
    if (![...camera, ...target].every(Number.isFinite) || camera.every((v, i) => v === target[i])) fail(`invalid camera in ${id}`);
    scenes[id] = { step, positions: {}, conceptIds: new Set(step.concept_ids), edgeIds: new Set(step.edge_ids),
      highlightedConceptIds: new Set(step.highlighted_concept_ids), highlightedEdgeIds: new Set(step.highlighted_edge_ids) };
  }
  for (const [id, position] of Object.entries(positions)) {
    const scene = scenes[position.step_id];
    if (!scene || !scene.conceptIds.has(position.concept_id)) fail(`position ${id} is outside its scene`);
    if (scene.positions[position.concept_id]) fail(`duplicate position for ${position.concept_id} in ${position.step_id}`);
    const xyz = [position.x, position.y, position.z];
    if (!xyz.every(Number.isFinite)) fail(`invalid coordinates in ${id}`);
    scene.positions[position.concept_id] = xyz;
  }
  for (const [id, scene] of Object.entries(scenes)) {
    if (scene.step.concept_ids.some(concept => !scene.positions[concept])) fail(`missing coordinates in ${id}`);
  }
  return { tours, scenes };
}

export function filterTours(tours, { audience = '', topic = '' } = {}) {
  return Object.entries(tours).filter(([, tour]) =>
    (!audience || tour.audience_tags.includes(audience)) &&
    (!topic || tour.topic_tags.includes(topic)));
}
