import test from "node:test";
import assert from "node:assert/strict";
import { createSelectionForce } from "./selection_force.mjs";

const node = (id, x, y = 0, z = 0) => ({ id, x, y, z, vx: 0, vy: 0, vz: 0 });
const settings = { radius: 10, strength: 0.35, spring: 0.3 };
function tick(force, nodes, count = 180) {
  for (let i = 0; i < count; i++) {
    force();
    for (const n of nodes) for (const axis of ["x", "y", "z"]) {
      n[`v${axis}`] *= 0.35;
      if (n[`f${axis}`] == null) n[axis] += n[`v${axis}`];
    }
  }
}

test("selection opens nearby space, preserves distant nodes, and returns without drift", () => {
  const nodes = [node("selected", 0), node("near", 2), node("far", 20)];
  const force = createSelectionForce(); force.initialize(nodes);
  for (let cycle = 0; cycle < 3; cycle++) {
    force.begin("selected", settings); tick(force, nodes);
    assert(nodes[1].x > 4 && nodes[1].x < 4.3);
    assert.equal(nodes[0].x, 0); assert.equal(nodes[2].x, 20);
    force.release(); tick(force, nodes);
    assert(Math.abs(nodes[1].x - 2) < 1e-6, "smooth return before final numerical snap");
    force.restore();
    assert.deepEqual(nodes.map(n => n.x), [0, 2, 20]);
    assert(!force.active());
  }
});

test("switching selections preserves the original layout; coincident and pinned nodes stay finite", () => {
  const nodes = [node("a", 0), node("b", 0), { ...node("pinned", 2), fx: 2 }, node("far", 40)];
  const force = createSelectionForce(); force.initialize(nodes);
  force.begin("a", settings); tick(force, nodes);
  assert(Math.hypot(nodes[1].x, nodes[1].y, nodes[1].z) > 0);
  force.begin("b", settings); tick(force, nodes);
  assert(nodes.every(n => [n.x, n.y, n.z].every(Number.isFinite)));
  assert.equal(nodes[2].x, 2);
  force.restore();
  assert.deepEqual(nodes.map(n => [n.x, n.y, n.z]), [[0, 0, 0], [0, 0, 0], [2, 0, 0], [40, 0, 0]]);
});
