// A reversible local expansion around a selected node. Distant nodes retain
// their anchors; switching selections reuses the same unexpanded layout.
export function createSelectionForce() {
  let nodes = [], anchors = null, selected = null;
  let radius, strength, spring;
  function force() {
    if (!anchors) return;
    const center = anchors.get(selected);
    nodes.forEach((node, index) => {
      const anchor = anchors.get(node.id);
      if (!anchor) return;
      const target = [...anchor];
      if (center && node.id !== selected) {
        let direction = anchor.map((value, axis) => value - center[axis]);
        const distance = Math.hypot(...direction);
        if (distance < radius) {
          // Deterministic direction for exactly coincident nodes.
          if (distance === 0) {
            direction = [0, 0, 0];
            direction[index % 3] = index % 2 ? 1 : -1;
          } else direction = direction.map(value => value / distance);
          const displacement = radius * strength * (1 - distance / radius) ** 2;
          for (let axis = 0; axis < 3; axis++) target[axis] += direction[axis] * displacement;
        }
      }
      ["x", "y", "z"].forEach((axis, i) => {
        if (node[`f${axis}`] == null) node[`v${axis}`] += (target[i] - node[axis]) * spring;
      });
    });
  }
  force.initialize = values => { nodes = values; };
  force.begin = (id, options) => {
    if (!nodes.some(node => node.id === id)) return false;
    ({ radius, strength, spring } = options);
    if (![radius, spring].every(value => Number.isFinite(value) && value > 0)
        || !Number.isFinite(strength) || strength < 0) throw new Error("Invalid DIPL selection force settings");
    if (!anchors) anchors = new Map(nodes.map(node => [node.id, [node.x, node.y, node.z]]));
    selected = id;
    return true;
  };
  force.release = () => { selected = null; };
  force.active = () => anchors !== null;
  force.returning = () => anchors !== null && selected === null;
  force.restore = () => {
    if (anchors) for (const node of nodes) {
      const anchor = anchors.get(node.id);
      if (!anchor) continue;
      ["x", "y", "z"].forEach((axis, i) => {
        if (node[`f${axis}`] == null) node[axis] = anchor[i];
        node[`v${axis}`] = 0;
      });
    }
    anchors = null; selected = null;
  };
  return force;
}
