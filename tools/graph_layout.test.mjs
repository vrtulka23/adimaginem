import test from 'node:test';
import assert from 'node:assert/strict';
import { orderedGraphRecords } from './graph_layout.mjs';
import { fixture } from './ontology_fixture.mjs';

test('DIPL list order controls initialization regardless of transport map ordering', () => {
  const original = fixture(), cached = structuredClone(original);
  original.ontology.edges.other = { ...original.ontology.edges.creation };
  original.graph_layout.edge_order.push({id: 'other', position: 1});
  cached.ontology.edges = {other: original.ontology.edges.other, ...cached.ontology.edges};
  cached.graph_layout = structuredClone(original.graph_layout);
  cached.graph_layout.concept_order.reverse();
  cached.graph_layout.edge_order.reverse();
  cached.ontology.concepts = Object.fromEntries(Object.entries(cached.ontology.concepts).reverse());
  const before = orderedGraphRecords(original), after = orderedGraphRecords(cached);
  assert.deepEqual(Object.keys(after.concepts), Object.keys(before.concepts));
  assert.deepEqual(Object.keys(after.edges), Object.keys(before.edges));
  assert.deepEqual(Object.keys(after.concepts), ['god', 'creature']);
});

test('missing, duplicate, and unknown layout IDs fail instead of silently changing seeds', () => {
  for (const change of [
    d => d.graph_layout.concept_order.pop(),
    d => { d.graph_layout.concept_order[1].id = 'god'; },
    d => { d.graph_layout.edge_order[0].id = 'missing'; },
    d => { d.graph_layout.concept_order[1].position = 0; },
    d => { d.graph_layout.concept_order[0].position = -1; },
  ]) {
    const data = fixture(); change(data);
    assert.throws(() => orderedGraphRecords(data), /Layout:/);
  }
});
