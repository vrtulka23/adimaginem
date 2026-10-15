import test from 'node:test';
import assert from 'node:assert/strict';
import { loadOntology } from './ontology_loader.mjs';
import { fixture } from './ontology_fixture.mjs';

for (const [name, page, endpoint, expected] of [
  ['Python', 'http://localhost:8765/', './api/ontology', 'http://localhost:8765/api/ontology'],
  ['static subpath', 'https://example.org/adimaginem/graph/', '/adimaginem/graph-assets/ontology.json', 'https://example.org/adimaginem/graph-assets/ontology.json'],
]) {
  test(`${name} fetches and validates its explicit endpoint`, async () => {
    const data = fixture();
    globalThis.document = { baseURI: page, querySelector: () => ({ content: endpoint }) };
    globalThis.fetch = async url => {
      assert.equal(String(url), expected);
      return { ok: true, json: async () => data };
    };
    assert.deepEqual(await loadOntology(), data);
    delete data.rationales.creation;
    await assert.rejects(loadOntology(), /missing rationale/);
    globalThis.fetch = async () => ({ ok: false, status: 503 });
    await assert.rejects(loadOntology(), /Ontology request failed: 503/);
  });
}
test('missing endpoint fails explicitly', async () => {
  globalThis.document = { querySelector: () => null };
  await assert.rejects(loadOntology(), /Missing ontology data endpoint/);
});
