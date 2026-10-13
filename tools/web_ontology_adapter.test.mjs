import test from "node:test";
import assert from "node:assert/strict";
import { decodeScalar } from "./web_ontology_adapter.mjs";

const value = (storedType, valueText, extra = {}) => ({path: "test", kind: "value", shape: [], units: null, storedType, valueText, ...extra});
test("evaluated scalar values preserve Unicode, escapes, numbers, and booleans", () => {
  const text = 'grâce "quoted"\n{subject}';
  assert.equal(decodeScalar(value("str", JSON.stringify(text))), text);
  assert.equal(decodeScalar(value("float64", "0.84999999999999998")), 0.85);
  assert.equal(decodeScalar(value("bool", "false")), false);
  assert.equal(decodeScalar(value("int64", "8")), 8);
  assert.equal(decodeScalar({kind: "group", valueUnavailableReason: "not_a_value"}), undefined);
});
test("unsupported or truncated values fail instead of silently losing data", () => {
  for (const description of [value("int64", "9007199254740993"), value("float64", "1", {units: "m"}),
    value("str", null), value("str", '["a"]', {shape: [1]}), value("bool", '"false"')]) {
    assert.throws(() => decodeScalar(description));
  }
});
