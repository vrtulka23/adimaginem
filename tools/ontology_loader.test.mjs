import test from "node:test";
import assert from "node:assert/strict";
import { loadOntology } from "./ontology_loader.mjs";

test("Python mode fetches its endpoint without starting WebAssembly", async () => {
  globalThis.document = { baseURI: "http://localhost:8765/", querySelector: () => ({content: "./api/ontology"}) };
  globalThis.Worker = class { constructor() { throw new Error("Unexpected worker"); } };
  globalThis.fetch = async url => {
    assert.equal(String(url), "http://localhost:8765/api/ontology");
    return {ok: true, json: async () => ({rationales: {edge: "cited"}})};
  };
  assert.deepEqual(await loadOntology(), {rationales: {edge: "cited"}});
  globalThis.fetch = async () => ({ok: false, status: 503});
  await assert.rejects(loadOntology(), /Python ontology request failed: 503/);
});

test("static mode starts the web worker without probing for a Python API", async () => {
  globalThis.document = {querySelector: () => null};
  globalThis.fetch = () => { throw new Error("Unexpected API probe"); };
  let terminated = false;
  globalThis.Worker = class {
    constructor(url, options) {
      assert(url.pathname.endsWith("/web_ontology_worker.mjs"));
      assert.equal(options.type, "module");
      setTimeout(() => this.onmessage({data: {type: "result", data: {ontology: "web"}}}), 0);
    }
    terminate() { terminated = true; }
  };
  assert.deepEqual(await loadOntology(), {ontology: "web"});
  assert(terminated);
});
