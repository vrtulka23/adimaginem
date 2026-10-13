import test from "node:test";
import assert from "node:assert/strict";
import { explainPath, collectInfluence } from "./relationship_summary.mjs";

function fixture() {
  return {
    ontology: {
      concepts: { angel: { label: "Angel" }, consent: { label: "Deliberate consent" } },
      relations: { cannot_compel: {
        label: "Cannot compel", description: "Excludes necessitating the voluntary act.",
        prose_template: "{subject} cannot compel {object}.",
      } },
      edges: { limit: {
        subject: "angel", object: "consent", relation: "cannot_compel",
        source_id: "authority", conditions: "The act is voluntary.",
        condition_source_id: "qualification", recipient_scope: "human_person",
        evidence_kind: "interpretive_inference", review_status: "draft",
      } },
      sources: { authority: { locator: "Passage A" }, qualification: { locator: "Passage B" } },
    },
    rationales: { limit: "Persuasion does not necessitate consent." },
  };
}

test("reverse traversal preserves the original negative claim and all qualifications", () => {
  const data = fixture();
  const { steps: [step] } = explainPath(data, ["consent", "angel"], ["limit"]);
  assert.equal(step.sentence, "Angel cannot compel Deliberate consent.");
  assert.equal(step.reversed, true);
  assert.equal(step.rationale, data.rationales.limit);
  assert.equal(step.edge.conditions, "The act is voluntary.");
  assert.equal(step.edge.recipient_scope, "human_person");
  assert.equal(step.edge.evidence_kind, "interpretive_inference");
  assert.equal(step.edge.review_status, "draft");
  assert.equal(step.source.locator, "Passage A");
  assert.equal(step.conditionSource.locator, "Passage B");
});

test("missing or unsupported templates fall back to the DIPL relation label", () => {
  for (const template of [undefined, null, "{subject} causes {unknown}."]) {
    const data = fixture();
    data.ontology.relations.cannot_compel.prose_template = template;
    const { steps: [step] } = explainPath(data, ["angel", "consent"], ["limit"]);
    assert.equal(step.sentence, "Angel — Cannot compel — Deliberate consent.");
    assert.equal(step.reversed, false);
  }
});

test("labels remain literal data rather than replacement syntax", () => {
  const data = fixture();
  data.ontology.concepts.angel.label = "$& {object} <b>literal</b>";
  const { steps: [step] } = explainPath(data, ["angel", "consent"], ["limit"]);
  assert.equal(step.sentence, "$& {object} <b>literal</b> cannot compel Deliberate consent.");
});

test("same-concept paths assert no relationship and unrelated edges are rejected", () => {
  const data = fixture();
  assert.deepEqual(explainPath(data, ["angel"], []).steps, []);
  assert.throws(() => explainPath(data, ["angel", "consent"], []));
  assert.throws(() => explainPath(data, ["angel", "angel"], ["limit"]));
});

test("an indirect path retains separate claims without composing causality", () => {
  const data = fixture();
  data.ontology.concepts.other = { label: "Other angel" };
  data.ontology.edges.other_limit = { ...data.ontology.edges.limit, subject: "other" };
  const result = explainPath(data, ["angel", "consent", "other"], ["limit", "other_limit"]);
  assert.deepEqual(result.steps.map(step => step.sentence), [
    "Angel cannot compel Deliberate consent.", "Other angel cannot compel Deliberate consent.",
  ]);
  assert.deepEqual(result.steps.map(step => step.reversed), [false, true]);
});

test("influence uses recipient scope and follows acts without inventing reciprocal effects", () => {
  const data = fixture();
  const o = data.ontology;
  Object.assign(o.concepts, { human_person: { label: "Human", category: "person" },
    suggestion: { label: "Suggestion", category: "act" },
    temptation: { label: "Temptation", category: "act" }, sin: { label: "Sin", category: "act" } });
  o.relations.cannot_compel.explanation_role = "limit";
  for (const [key, role] of [["can_perform", "capacity"], ["is_kind_of", "context"], ["inclines_to", "effect"]]) {
    o.relations[key] = { label: key, description: key, explanation_role: role };
  }
  const edge = (subject, relation, object) => ({ subject, relation, object, recipient_scope: "human_person" });
  Object.assign(o.edges, { suggest: edge("angel", "can_perform", "suggestion"),
    kind: edge("suggestion", "is_kind_of", "temptation"),
    incline: edge("temptation", "inclines_to", "sin") });
  const ids = Object.keys(o.edges);
  const result = collectInfluence(data, "angel", "human_person", ids, 3);
  assert.deepEqual(result.statements.map(s => s.id), ["suggest", "kind", "incline"]);
  assert.deepEqual(result.limits.map(s => s.id), ["limit"]);
  assert.equal(collectInfluence(data, "human_person", "angel", ids, 3).statements.length, 0);
  assert.deepEqual(collectInfluence(data, "angel", "human_person", ["limit"], 3).statements, []);
  assert.equal(collectInfluence(data, "angel", "human_person", ids, 1).statements.length, 1);
  assert.equal(collectInfluence(data, "angel", "sin", ids, 3).statements.length, 3);
});

test("shared classification does not transfer agency and scopes do not cross recipients", () => {
  const data = fixture(), o = data.ontology;
  o.concepts.other = { label: "Other", category: "person" };
  o.concepts.human_person = { label: "Human", category: "person" };
  o.relations.kind = { label: "Kind", explanation_role: "context" };
  o.relations.effect = { label: "Affects", explanation_role: "effect" };
  o.edges.kind = { subject: "angel", relation: "kind", object: "other", recipient_scope: "human_person" };
  o.edges.effect = { subject: "other", relation: "effect", object: "consent", recipient_scope: "human_person" };
  o.edges.wrong_scope = { subject: "angel", relation: "effect", object: "consent", recipient_scope: "blessed_angel" };
  assert.deepEqual(collectInfluence(data, "angel", "human_person", Object.keys(o.edges), 3).statements, []);
});
