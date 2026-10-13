// Deterministic prose from evaluated DIPL. No inferred inverse or composite claim.
export function explainPath(data, nodes, edgeIds) {
  const { concepts, edges, relations, sources } = data.ontology;
  if (!nodes.length || edgeIds.length !== nodes.length - 1) throw new Error("Invalid explanation path");
  const steps = edgeIds.map((id, i) => {
    const edge = edges[id];
    if (!edge || !((edge.subject === nodes[i] && edge.object === nodes[i + 1])
      || (edge.object === nodes[i] && edge.subject === nodes[i + 1]))) {
      throw new Error(`Edge ${id} does not connect this path step`);
    }
    const relation = relations[edge.relation];
    const template = relation.prose_template;
    const valid = typeof template === "string" && template.includes("{subject}")
      && template.includes("{object}") && !/[{}]/.test(template.replace(/\{subject\}|\{object\}/g, ""));
    // A callback keeps literal replacement characters in concept labels intact.
    const sentence = valid
      ? template.replace(/\{subject\}|\{object\}/g, key => concepts[edge[key.slice(1, -1)]].label)
      : `${concepts[edge.subject].label} — ${relation.label} — ${concepts[edge.object].label}.`;
    return {
      id, edge, sentence, description: relation.description,
      rationale: data.rationales?.[id] || "",
      reversed: edge.subject !== nodes[i],
      source: sources[edge.source_id],
      conditionSource: sources[edge.condition_source_id],
    };
  });
  return { steps, labels: nodes.map(id => concepts[id].label) };
}

// Select supporting records, not a composed causal assertion. A recipient scope
// connects statements to a recipient class without inventing a graph edge to it.
export function collectInfluence(data, start, target, edgeIds, maxDepth) {
  const { concepts, edges, relations } = data.ontology;
  if (start === target) return { statements: [], limits: [] };
  const rows = edgeIds.map(id => [id, edges[id]]);
  const outgoing = new Map();
  for (const row of rows) {
    if (!outgoing.has(row[1].subject)) outgoing.set(row[1].subject, []);
    outgoing.get(row[1].subject).push(row);
  }
  const scopeTarget = Object.values(edges).some(e => e.recipient_scope === target);
  const withinScope = e => !scopeTarget || !e.recipient_scope || e.recipient_scope === "unspecified" || e.recipient_scope === target;
  const relevant = e => e.object === target || e.recipient_scope === target;
  const selected = new Set(), expanded = new Set(), queue = [{ node: start, path: [] }];
  const depth = Math.max(1, Math.floor(maxDepth));
  for (let i = 0; i < queue.length; i++) {
    const { node, path } = queue[i];
    if (expanded.has(node) || path.length >= depth) continue;
    expanded.add(node);
    for (const [id, edge] of outgoing.get(node) || []) {
      if (!withinScope(edge)) continue;
      const role = relations[edge.relation].explanation_role || "context";
      // An act may be explained through its broader act category. This is not
      // inheritance of agency: never route through a shared creator or an agent class.
      const actContext = path.length > 0 && edge.relation === "is_kind_of"
        && concepts[node].category === "act" && concepts[edge.object].category === "act";
      if (!["capacity", "effect"].includes(role) && !actContext) continue;
      const next = [...path, id];
      if (relevant(edge)) next.forEach(key => selected.add(key));
      if (role === "capacity" || ["act", "office"].includes(concepts[edge.object].category)) {
        queue.push({ node: edge.object, path: next });
      }
    }
  }
  const involved = new Set([start]);
  for (const id of selected) { involved.add(edges[id].subject); involved.add(edges[id].object); }
  const limits = rows.filter(([, e]) => relations[e.relation].explanation_role === "limit"
    && withinScope(e) && (involved.has(e.subject) || involved.has(e.object))
    && (relevant(e) || involved.has(e.object))).map(([id]) => id);
  const statement = id => explainPath(data, [edges[id].subject, edges[id].object], [id]).steps[0];
  return { statements: [...selected].map(statement), limits: limits.map(statement) };
}
