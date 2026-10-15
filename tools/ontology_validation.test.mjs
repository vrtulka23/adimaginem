import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOntology } from './ontology_validation.mjs';
import { fixture } from './ontology_fixture.mjs';

test('a cited graph passes; inconsistent claims and references fail', () => {
  assert.equal(validateOntology(fixture()).ontology.edges.creation.subject, 'god');
  for (const [mutate, message] of [
    [d => { d.ontology.edges.creation.subject = 'missing'; }, /unknown endpoint/],
    [d => { d.ontology.edges.creation.subject = 'creature'; }, /only God may create/],
    [d => { d.ontology.edges.creation.conditions = 'A qualification'; }, /condition citation/],
    [d => { d.ontology.relations.creates.principle_id = 'missing'; }, /unknown principle/],
    [d => { d.ontology.concepts.god.study_areas.push('philosophy'); }, /study areas/],
    [d => { d.ontology.relations.creates.prose_template = '{subject} {invented}'; }, /prose template/],
    [d => { d.rationales.orphan = 'Not an edge'; }, /orphan rationale/],
    [d => { delete d.graph_concept_styles.god; }, /color style/],
  ]) {
    const data = fixture(); mutate(data);
    assert.throws(() => validateOntology(data), message);
  }
});

test('passion profiles must agree with their cited appetite relation', () => {
  const data = fixture();
  data.ontology.concepts.creature.category = 'passion';
  data.ontology.passion_profiles.creature = { concept_id: 'creature', appetite_id: 'god', source_id: 'text' };
  data.profile_rationales.creature = 'Test rationale';
  assert.throws(() => validateOntology(data), /appetite disagrees/);
});
