import * as THREE from "https://esm.sh/three";
import { SVGLoader } from "https://esm.sh/three/examples/jsm/loaders/SVGLoader.js";
import {
  faAppleWhole, faBrain, faCompass, faCross, faCube, faCrown, faDove,
  faEye, faGem, faGift, faHeart, faMedal, faPaw, faPerson,
  faSeedling, faShareNodes, faSun, faWineGlass
} from "https://esm.sh/@fortawesome/free-solid-svg-icons@6.7.2";

window.addEventListener("error", (event) => {
  const status = document.querySelector("#layout-status");
  if (status && !status.textContent.startsWith("Icon creation failed")) status.textContent = `Graph runtime error: ${event.message}`;
});
window.addEventListener("unhandledrejection", (event) => {
  const status = document.querySelector("#layout-status");
  if (status) status.textContent = `Graph runtime error: ${event.reason?.message || event.reason}`;
});

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

let colorGroups, relationColors, conceptGroups;
const focusedGroups = new Set();
const shortKinds = new Set(["identity", "classification", "composition"]);
let db, concepts, edges, positions, graph, iconSize, iconGap, iconHitPadding, sizeConfig, activeSignature = "", layoutNeedsFit = false;
let nodeRegistry = {}, nodeVisuals = {}, pathEdgeIds = new Set(), pathNodeIds = new Set(), selected = null, initialTickReported = false;
let selectionRing;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function createSelectionRing() {
  const radius = sizeConfig.selection_ring_radius;
  const width = sizeConfig.selection_ring_width;
  const extent = radius + 4 * width;
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: {
      color: { value: new THREE.Color(sizeConfig.selection_ring_color) },
      radius: { value: radius }, width: { value: width }, extent: { value: extent },
      opacity: { value: sizeConfig.selection_ring_opacity },
      dashes: { value: sizeConfig.selection_ring_dashes },
      phase: { value: 0 }
    },
    vertexShader: `
      varying vec2 ringUv;
      void main() {
        ringUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 ringUv;
      uniform vec3 color;
      uniform float radius, width, extent, opacity, dashes, phase;
      void main() {
        vec2 p = (ringUv * 2.0 - 1.0) * extent;
        float distanceToRing = abs(length(p) - radius);
        float core = 1.0 - smoothstep(width * 0.3, width, distanceToRing);
        float glow = exp(-pow(distanceToRing / (width * 1.8), 2.0));
        float dash = smoothstep(-0.25, 0.25, sin((atan(p.y, p.x) - phase) * dashes));
        float alpha = opacity * (core * (0.22 + 0.65 * dash) + glow * 0.13);
        if (alpha < 0.005) discard;
        gl_FragColor = vec4(mix(color, vec3(1.0), core * dash * 0.45), alpha);
      }
    `
  });
  selectionRing = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  selectionRing.name = "selected-concept-ring";
  selectionRing.userData.extent = extent;
  // Decoration is separate from node geometry and never enlarges a pointer target.
  selectionRing.raycast = () => {};
  selectionRing.visible = false;
  selectionRing.onBeforeRender = () => {
    material.uniforms.phase.value = reducedMotion.matches ? 0
      : performance.now() / 1000 * sizeConfig.selection_ring_speed;
  };
  graph.scene().add(selectionRing);
}

function syncSelectionRing() {
  if (!selectionRing) return;
  const node = graph.graphData().nodes.find((node) => node.id === selected);
  const visual = node && nodeVisuals[node.id];
  selectionRing.visible = Boolean(visual);
  if (!visual) return;
  // Engine ticks precede the renderer's node-mesh position update.
  selectionRing.position.set(node.x, node.y, node.z);
  visual.parent.localToWorld(selectionRing.position);
  graph.scene().worldToLocal(selectionRing.position);
  selectionRing.quaternion.copy(graph.camera().quaternion);
  selectionRing.scale.setScalar(iconSize * selectionRing.userData.extent);
}

function nodeColor(id) { return colorGroups[conceptGroups[id]].color; }
function colorLabel(entry) { return entry.metadata.category; }
function isFocused(id) { return focusedGroups.has(conceptGroups[id]); }
function applyNodeStyle(id, material) {
  const active = selected === id || pathNodeIds.has(id), focused = isFocused(id);
  material.color.set(nodeColor(id));
  material.emissive.set(nodeColor(id));
  material.emissiveIntensity = active || focused ? sizeConfig.focus_emission : 0.035;
  material.opacity = focusedGroups.size && !focused && !active ? sizeConfig.dimmed_icon_opacity : 1;
  material.depthWrite = material.opacity === 1;
}
function incidentToSelection(link) {
  return selected && [link.source.id || link.source, link.target.id || link.target].includes(selected);
}
function relationColor(link, arrow = false) {
  const focused = isFocused(link.source.id || link.source) || isFocused(link.target.id || link.target);
  const path = pathEdgeIds.has(link.edgeId);
  const color = path ? "#ffe08b" : relationColors[link.kind].color;
  const opacity = path || incidentToSelection(link) ? 1 : focusedGroups.size || selected
    ? (focused ? (arrow ? sizeConfig.arrow_opacity : sizeConfig.focused_relation_opacity) : sizeConfig.dimmed_relation_opacity)
    : (arrow ? sizeConfig.arrow_opacity : sizeConfig.relation_opacity);
  const rgb = color.slice(1).match(/../g).map((v) => parseInt(v, 16));
  return `rgba(${rgb.join(",")},${opacity})`;
}
function relationWidth(link) {
  return pathEdgeIds.has(link.edgeId) || incidentToSelection(link)
    ? sizeConfig.highlighted_relation_width : sizeConfig.relation_width;
}
function arrowLength() { return iconSize * sizeConfig.arrow_size_ratio; }

function separateParallelLinks(links) {
  const pairs = new Map();
  for (const link of links) {
    const key = JSON.stringify([link.source, link.target].sort());
    if (!pairs.has(key)) pairs.set(key, []);
    pairs.get(key).push(link);
  }
  for (const group of pairs.values()) {
    group.sort((a, b) => a.edgeId.localeCompare(b.edgeId));
    group.forEach((link, i) => {
      // Reverse links use the same canonical orientation when assigning lanes.
      const direction = link.source <= link.target ? 1 : -1;
      link.curvature = direction * (i - (group.length - 1) / 2) * sizeConfig.parallel_curve_step;
      if (link.source === link.target) link.curvature = (i + 1) * sizeConfig.parallel_curve_step;
    });
  }
}
function fillColorLegend() {
  document.querySelector("#concept-colors").innerHTML = Object.entries(colorGroups)
    .filter(([key]) => Object.values(conceptGroups).includes(key))
    .map(([key, group]) => `<button type="button" class="legend-item" data-group="${esc(key)}" aria-pressed="false"><span class="swatch" style="background:${esc(group.color)}"></span><span>${esc(colorLabel(group))}</span><span class="legend-count"></span></button>`).join("");
  document.querySelector("#concept-colors").addEventListener("click", (event) => {
    const button = event.target.closest("[data-group]");
    if (!button) return;
    const key = button.dataset.group;
    if (focusedGroups.has(key)) focusedGroups.delete(key); else focusedGroups.add(key);
    updateVisualState();
  });
  document.querySelector("#clear-color-focus").addEventListener("click", () => { focusedGroups.clear(); updateVisualState(); });
  document.querySelector("#relation-colors").innerHTML = Object.entries(relationColors)
    .map(([key, entry]) => `<div class="legend-item relation-key" data-kind="${esc(key)}"><span class="swatch line-swatch" style="background:${esc(entry.color)}"></span><span>${esc(colorLabel(entry))}</span><span class="legend-count"></span></div>`).join("");
}
function updateLegend() {
  const domains = activeDomains(), counts = {}, relationCounts = {};
  for (const [id, c] of Object.entries(concepts)) if (domains.has(c.domain)) counts[conceptGroups[id]] = (counts[conceptGroups[id]] || 0) + 1;
  for (const [, edge] of activeEdges()) {
    const kind = db.ontology.relations[edge.relation].kind;
    relationCounts[kind] = (relationCounts[kind] || 0) + 1;
  }
  document.querySelectorAll("#concept-colors [data-group]").forEach((button) => {
    const key = button.dataset.group, count = counts[key] || 0;
    button.setAttribute("aria-pressed", String(focusedGroups.has(key)));
    button.classList.toggle("muted-group", Boolean(focusedGroups.size && !focusedGroups.has(key)));
    button.disabled = !count && !focusedGroups.has(key);
    button.querySelector(".legend-count").textContent = count;
  });
  document.querySelectorAll("#relation-colors [data-kind]").forEach((row) => {
    row.querySelector(".legend-count").textContent = relationCounts[row.dataset.kind] || 0;
  });
  document.querySelector("#clear-color-focus").hidden = !focusedGroups.size;
}

function iconFamily(id, category) {
  if (["angelic_order", "angelic_hierarchy"].includes(category)) return "celestial";
  if (["trinity"].includes(id)) return "trinity";
  if (["god", "divine_essence", "pure_act", "rational_soul", "grace", "sanctifying_grace", "actual_grace", "sacramental_grace"].includes(id) || id.includes("grace")) return "radiance";
  if (["father", "son", "holy_spirit"].includes(id)) return "divine_person";
  if (id.includes("angel")) return "celestial";
  if (id.includes("person") || id === "human_person") return "person";
  if (id.includes("body") || id.includes("organ")) return "body";
  if (id.includes("plant") || id.includes("vegetative") || id.includes("growth")) return "plant";
  if (id.includes("animal") || id.includes("nonhuman")) return "creature";
  if (id.includes("virtue") || id.includes("habit")) return "laurel";
  if (id.includes("gift")) return "gift";
  if (id.includes("fruit")) return "fruit";
  if (id.includes("sacrament")) return "chalice";
  if (id.includes("passion") || id === "passion") return "heart";
  if (id.includes("sense") || id.includes("sight") || id.includes("hearing") || id.includes("smell") || id.includes("taste") || id.includes("touch")) return "eye";
  if (id.includes("memory") || id.includes("imagination") || id.includes("cogitative")) return "mind";
  if (id.includes("will") || id.includes("appetite") || id.includes("desire") || id.includes("aversion")) return "compass";
  if (id.includes("choice") || id.includes("reason") || id.includes("intellect") || id.includes("cognition")) return "mind";
  if (id.includes("cause") || id.includes("principle") || id.includes("potency") || id.includes("act") || id.includes("form") || id.includes("substance") || id.includes("accident")) return "crystal";
  if (category === "sacrament") return "chalice";
  if (category === "fruit") return "fruit";
  if (category === "gift") return "gift";
  if (category === "virtue") return "laurel";
  if (category === "power" || category === "power_genus") return "mind";
  return "crystal";
}

function iconDefinition(node) {
  const family = iconFamily(node.id, node.category);
  if (family === "divine_person") {
    if (node.id === "father") return faCrown;
    if (node.id === "son") return faCross;
    return faDove;
  }
  return ({
    trinity: faShareNodes, radiance: faSun, celestial: faDove,
    person: faPerson, body: faPerson, plant: faSeedling,
    creature: faPaw, heart: faHeart, laurel: faMedal,
    gift: faGift, fruit: faAppleWhole, chalice: faWineGlass,
    eye: faEye, mind: faBrain, compass: faCompass,
    crystal: faGem
  })[family] || faCube;
}

function makeSculpture(node) {
  const icon = iconDefinition(node);
  const [width, height, , , pathData] = icon.icon;
  const paths = Array.isArray(pathData) ? pathData : [pathData];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${paths.map((d) => `<path d="${d}"/>`).join("")}</svg>`;
  const parsed = new SVGLoader().parse(svg);
  const shapes = parsed.paths.flatMap((path) => path.toShapes());
  if (!shapes.length) throw new Error(`No vector shapes for icon ${node.id}`);
  const points = shapes.flatMap((shape) => shape.getPoints(16));
  const xs = points.map((point) => point.x), ys = points.map((point) => point.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const unit = 0.92 / Math.max(maxX - minX, maxY - minY);
  const depth = 0.09;
  const geometry = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.009, bevelThickness: 0.012, curveSegments: 8 });
  geometry.scale(unit, -unit, unit);
  geometry.translate(-(minX + maxX) * unit / 2, (minY + maxY) * unit / 2, -depth / 2);
  geometry.computeVertexNormals();
  const color = nodeColor(node.id);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.04, emissive: color, emissiveIntensity: 0.035, transparent: true, side: THREE.DoubleSide });
  applyNodeStyle(node.id, material);
  const group = new THREE.Group();
  const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, colorWrite: false, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
  const hitTarget = new THREE.Mesh(geometry, hitMaterial);
  hitTarget.scale.setScalar(1 + iconHitPadding / iconSize);
  hitTarget.name = "invisible-pointer-target";
  group.add(hitTarget);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true; mesh.receiveShadow = true;
  group.add(mesh);
  group.scale.setScalar(iconSize);
  const label = makeLabelSprite(node.label);
  group.add(label);
  group.userData.label = label;
  group.userData.iconMaterial = material;
  group.userData.nodeId = node.id;
  nodeVisuals[node.id] = group;
  return group;
}

function makeLabelSprite(text) {
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d");
  const font = "600 48px Inter, system-ui, sans-serif";
  ctx.font = font;
  canvas.width = Math.ceil(ctx.measureText(text).width) + 48; canvas.height = 96;
  ctx.fillStyle = "rgba(10,16,22,.88)"; ctx.beginPath(); ctx.roundRect(4, 6, canvas.width - 8, 84, 22); ctx.fill();
  ctx.strokeStyle = "rgba(158,206,205,.58)"; ctx.lineWidth = 3; ctx.stroke();
  ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#eef6f5"; ctx.fillText(text, canvas.width / 2, 49);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false }));
  sprite.center.set(0.5, 1);
  sprite.position.set(0, -(sizeConfig.selection_ring_radius + 3 * sizeConfig.selection_ring_width + sizeConfig.label_gap), 0.12);
  sprite.renderOrder = 10;
  const viewPosition = new THREE.Vector3();
  // Keep proportional sizing nearby, with a readable text size in the overview.
  sprite.onBeforeRender = (renderer, scene, camera) => {
    sprite.getWorldPosition(viewPosition).applyMatrix4(camera.matrixWorldInverse);
    const worldPerPixel = 2 * Math.max(0, -viewPosition.z)
      / (camera.projectionMatrix.elements[5] * graph.height());
    const minimumHeight = sizeConfig.label_min_text_pixels * (canvas.height / 48) * worldPerPixel / iconSize;
    const height = Math.max(sizeConfig.label_height, minimumHeight);
    sprite.scale.set(height * canvas.width / canvas.height, height, 1);
    sprite.updateMatrixWorld(true);
  };
  sprite.raycast = () => {};
  sprite.visible = false;
  return sprite;
}

function positionSeed(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
function initialLayout() {
  const ids = Object.keys(concepts), n = ids.length, pos = {};
  ids.forEach((id, i) => { const y = 1 - 2 * (i + .5) / n, r = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5)), j = (positionSeed(id) - .5) * .2; pos[id] = [5 * r * Math.cos(a) + j, 5 * y, 5 * r * Math.sin(a) - j]; });
  return pos;
}
function activeDomains() { return new Set([...document.querySelectorAll("#domains input:checked")].map((x) => x.value)); }
function activeEdges() {
  const selectedRelations = [...document.querySelector("#relations").selectedOptions].map((o) => o.value), domains = activeDomains(), included = document.querySelector("#included").checked;
  return Object.entries(edges).filter(([, e]) => (!included || e.included_in_model) && (!selectedRelations.length || selectedRelations.includes(e.relation)) && concepts[e.subject] && concepts[e.object] && domains.has(concepts[e.subject].domain) && domains.has(concepts[e.object].domain));
}
function visibleNodes() {
  const domains = activeDomains();
  return Object.entries(concepts).filter(([, c]) => domains.has(c.domain)).map(([id, c]) => {
    if (!nodeRegistry[id]) { const [x, y, z] = positions[id]; nodeRegistry[id] = { id, label: c.label, domain: c.domain, category: c.category, x, y, z }; }
    return nodeRegistry[id];
  });
}
function preferredDistance(edge) {
  const base = edge.relation === "is_kind_of" ? 2.7 : shortKinds.has(edge.kind) ? 3.2 : 4.1;
  return sizeConfig.link_spacing * Math.max(base, iconSize + 2 * iconGap + 2 * arrowLength());
}
function configureForces() {
  graph.d3Force("link")
    .distance((edge) => preferredDistance(edge))
    .strength((edge) => edge.relation === "is_kind_of" ? 0.5 : shortKinds.has(edge.kind) ? 0.3 : 0.2);
  graph.d3Force("charge").strength(sizeConfig.charge_strength * (iconSize / sizeConfig.icon_size) ** 2);
  graph.d3Force("center", d3.forceCenter(0, 0, 0));
  graph.d3Force("collide", d3.forceCollide(() => iconSize * 0.5 + iconGap + arrowLength() * 0.5).strength(0.72).iterations(2));
}
function syncBillboards() {
  if (!graph) return;
  const q = graph.camera().quaternion;
  for (const visual of Object.values(nodeVisuals)) visual.quaternion.copy(q);
  syncSelectionRing();
}
function updateVisualState() {
  const showAll = document.querySelector("#show-labels").checked;
  for (const [id, visual] of Object.entries(nodeVisuals)) {
    const active = selected === id || pathNodeIds.has(id);
    applyNodeStyle(id, visual.userData.iconMaterial);
    const label = visual.userData.label;
    if (label) label.visible = showAll || active;
  }
  updateLegend();
  syncBillboards();
  graph?.linkColor((link) => relationColor(link));
  graph?.linkDirectionalArrowColor((link) => relationColor(link, true));
  graph?.linkWidth(relationWidth);
}
function graphSignature(nodes, links) { return `${nodes.map((n) => n.id).sort().join(",")}|${links.map((l) => l.edgeId).sort().join(",")}`; }
function draw(reheatChanged = true) {
  if (!graph) return;
  const nodes = visibleNodes(), nodeIds = new Set(nodes.map((n) => n.id));
  const links = activeEdges().map(([edgeId, e]) => ({ edgeId, source: e.subject, target: e.object, relation: e.relation, kind: db.ontology.relations[e.relation]?.kind || "metaphysical" })).filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  separateParallelLinks(links);
  const signature = graphSignature(nodes, links), changed = signature !== activeSignature;
  if (changed) {
    activeSignature = signature;
    layoutNeedsFit = true;
    graph.graphData({ nodes, links });
    configureForces();
    if (reheatChanged) graph.d3ReheatSimulation();
  }
  updateVisualState();
}
function createGraph() {
  const el = document.querySelector("#graph");
  graph = new window.ForceGraph3D(el, { controlType: "orbit", rendererConfig: { antialias: true, alpha: true } })
    .width(el.clientWidth)
    .height(el.clientHeight)
    .backgroundColor("#101419")
    .nodeId("id")
    .nodeThreeObject(makeSculpture)
    .nodeLabel((n) => `${esc(n.label)}<br><span style="color:${nodeColor(n.id)}">${esc(colorLabel(colorGroups[conceptGroups[n.id]]))}</span><br><span style="color:#93a9b7">${esc(n.id)}</span>`)
    .linkColor((link) => relationColor(link))
    .linkOpacity(1)
    .linkWidth(relationWidth)
    .linkCurvature("curvature")
    .linkDirectionalArrowLength(arrowLength)
    .linkDirectionalArrowRelPos(sizeConfig.arrow_position)
    .linkDirectionalArrowColor((link) => relationColor(link, true))
    .linkLabel((link) => `${esc(concepts[link.source.id || link.source].label)} → ${esc(db.ontology.relations[link.relation].label)} → ${esc(concepts[link.target.id || link.target].label)}`)
    .onNodeClick((node) => { selectConcept(node.id); document.querySelector("#search").value = node.id; })
    .onNodeHover((node) => { el.style.cursor = node ? "pointer" : "grab"; })
    .onEngineTick(() => { const active = visibleNodes(); for (const n of active) positions[n.id] = [n.x, n.y, n.z]; if (!initialTickReported && active.length) { const extent = ["x", "y", "z"].map((axis) => (Math.max(...active.map((n) => n[axis])) - Math.min(...active.map((n) => n[axis]))).toFixed(1)).join(" × "); document.querySelector("#layout-status").textContent = `Settling ${active.length} concepts · initial spread ${extent}.`; initialTickReported = true; } syncBillboards(); })
    .onEngineStop(() => { const settled = visibleNodes(); for (const n of settled) positions[n.id] = [n.x, n.y, n.z]; const span = settled.length ? Math.max(...["x", "y", "z"].map((axis) => Math.max(...settled.map((n) => n[axis])) - Math.min(...settled.map((n) => n[axis])))).toFixed(1) : "0"; document.querySelector("#layout-status").textContent = `Layout settled · ${settled.length} concepts · span ${span}. Change filters or icon size to anneal again.`; if (layoutNeedsFit) { graph.zoomToFit(700, sizeConfig.fit_padding); layoutNeedsFit = false; } });
  graph.d3AlphaDecay(0.045).d3AlphaMin(0.002).d3VelocityDecay(0.65).cooldownTime(9000);
  graph.scene().add(new THREE.AmbientLight(0x9fb1c7, 1.7));
  const key = new THREE.DirectionalLight(0xffefd1, 2.4); key.position.set(-9, 12, 15); graph.scene().add(key);
  const fill = new THREE.DirectionalLight(0x94c9ff, 1.25); fill.position.set(8, -5, 10); graph.scene().add(fill);
  createSelectionRing();
  graph.controls().addEventListener("change", syncBillboards);
  graph.cameraPosition({ x: 25, y: 18, z: 29 }, { x: 0, y: 0, z: 0 }, 0);
}

function iconName(id, category) { return iconFamily(id, category).replaceAll("_", " "); }
function selectConcept(id) { if (!concepts[id]) return; selected = id; showDetails(id); updateVisualState(); }
function showDetails(id) {
  const c = concepts[id], source = db.ontology.sources[c.source_id];
  const incident = Object.entries(edges).filter(([, e]) => e.subject === id || e.object === id);
  let html = `<h2>Concept</h2><div class="detail-title">${esc(c.label)}</div><div class="latin">${esc(c.latin_name)}</div><div class="id">${esc(id)}</div><span class="tag">${esc(c.domain)}</span><span class="tag">${esc(c.category.replaceAll("_", " "))}</span><span class="tag">${esc(c.review_status)}</span><div class="note">${esc(c.note)}</div><div class="section-title">Icon</div><div class="note">${esc(iconName(id, c.category))} · Font Awesome Free vector, extruded in 3D</div><div class="section-title">Definition source</div>${citation(source, c.source_id)}`;
  if (incident.length) {
    html += `<div class="section-title">Connected relations · ${incident.length}</div>`;
    for (const [edgeId, e] of incident) {
      const outgoing = e.subject === id, other = outgoing ? e.object : e.subject, edgeSource = db.ontology.sources[e.source_id], rationale = db.rationales?.[edgeId] || "";
      const qualifiers = [["Recipient", e.recipient_scope], ["Aspect", e.affected_aspect], ["Causality", e.causal_mode]]
        .filter(([, value]) => value && value !== "unspecified")
        .map(([name, value]) => `<span class="tag">${name}: ${esc(value.replaceAll("_", " "))}</span>`).join("");
      const condition = e.conditions ? `<div><b>Conditions:</b> ${esc(e.conditions)}</div>${citation(db.ontology.sources[e.condition_source_id], e.condition_source_id)}` : "";
      html += `<div class="edge-row"><button data-node="${esc(other)}">${esc(concepts[other].label)}</button><br><b>${outgoing ? "→" : "←"} ${esc(db.ontology.relations[e.relation]?.label || e.relation)}</b><div>${esc(rationale)}</div>${qualifiers}${citation(edgeSource, e.source_id)}${condition}</div>`;
    }
  }
  document.querySelector("#details").innerHTML = html;
  document.querySelectorAll("[data-node]").forEach((button) => button.addEventListener("click", () => { selectConcept(button.dataset.node); document.querySelector("#search").value = button.dataset.node; }));
}
function citation(source, id) {
  if (!source) return `<span class="small">Source: ${esc(id || "unknown")}</span>`;
  return `<div class="citation"><b>${esc(source.author)}</b>, <i>${esc(source.work)}</i>, ${esc(source.locator)}<br><a href="${esc(source.url)}" target="_blank" rel="noopener">Open source ↗</a></div>`;
}
function fillControls() {
  const list = document.querySelector("#concept-list"), from = document.querySelector("#from"), to = document.querySelector("#to");
  for (const [id, c] of Object.entries(concepts).sort((a, b) => a[1].label.localeCompare(b[1].label))) {
    const option = document.createElement("option"); option.value = id; option.label = `${c.label} · ${id}`; list.append(option);
    for (const select of [from, to]) { const item = document.createElement("option"); item.value = id; item.textContent = c.label; select.append(item); }
  }
  from.value = "god"; to.value = "human_person";
  const domains = [...new Set(Object.values(concepts).map((c) => c.domain))].sort();
  document.querySelector("#domains").innerHTML = domains.map((domain) => `<label class="check"><input type="checkbox" value="${esc(domain)}" checked>${esc(domain)}</label>`).join("");
  document.querySelectorAll("#domains input").forEach((input) => input.addEventListener("change", () => { pathEdgeIds.clear(); pathNodeIds.clear(); draw(); }));
  const relations = document.querySelector("#relations");
  for (const id of Object.keys(db.ontology.relations).sort()) { const option = document.createElement("option"); option.value = id; option.textContent = db.ontology.relations[id].label; relations.append(option); }
  document.querySelector("#counts").innerHTML = `<span class="pill">${Object.keys(concepts).length} concepts</span><span class="pill">${Object.keys(edges).length} relations</span><span class="pill">${Object.keys(db.ontology.sources).length} sources</span>`;
}
function shortestPath() {
  const start = document.querySelector("#from").value, end = document.querySelector("#to").value;
  if (!start || !end) return;
  const rows = activeEdges(), directed = document.querySelector("#directed").checked, adj = {};
  for (const [edgeId, edge] of rows) { (adj[edge.subject] ||= []).push({ node: edge.object, id: edgeId }); if (!directed) (adj[edge.object] ||= []).push({ node: edge.subject, id: edgeId }); }
  const queue = [start], previous = { [start]: null };
  for (let i = 0; i < queue.length && !Object.hasOwn(previous, end); i++) for (const step of adj[queue[i]] || []) { if (Object.hasOwn(previous, step.node)) continue; previous[step.node] = { from: queue[i], edge: step.id }; queue.push(step.node); if (step.node === end) break; }
  pathEdgeIds.clear(); pathNodeIds.clear(); const output = document.querySelector("#path-result");
  if (!Object.hasOwn(previous, end)) { output.className = "path-result none"; output.textContent = `No path found from “${concepts[start].label}” to “${concepts[end].label}” with these filters.`; updateVisualState(); return; }
  const ordered = [end]; let current = end; pathNodeIds.add(current);
  while (current !== start) { const step = previous[current]; pathEdgeIds.add(step.edge); current = step.from; pathNodeIds.add(current); ordered.push(current); }
  ordered.reverse(); const relations = ordered.slice(1).map((id) => db.ontology.relations[edges[previous[id].edge].relation]?.label || edges[previous[id].edge].relation);
  output.className = "path-result";
  output.innerHTML = `${ordered.length - 1} edge${ordered.length === 2 ? "" : "s"}:<br>${ordered.map((id, i) => {
    if (i >= relations.length) return esc(concepts[id].label);
    const forward = edges[previous[ordered[i + 1]].edge].subject === id;
    return `${esc(concepts[id].label)} <span style="color:#ffe08b">${forward ? "—" : "←"}${esc(relations[i])}${forward ? "→" : "—"}</span><br>`;
  }).join("")}`;
  updateVisualState();
}
function setIconSize(value, anneal = true) {
  iconSize = Number(value);
  document.querySelector("#icon-size").value = String(iconSize);
  document.querySelector("#icon-size-value").value = iconSize.toFixed(2);
  for (const visual of Object.values(nodeVisuals)) visual.scale.setScalar(iconSize);
  syncSelectionRing();
  if (anneal) layoutNeedsFit = true;
  if (graph) { configureForces(); graph.linkDirectionalArrowLength(arrowLength); if (anneal) graph.d3ReheatSimulation(); graph.refresh(); }
}
function restoreLayout() {
  const initial = initialLayout();
  for (const [id, node] of Object.entries(nodeRegistry)) { const [x, y, z] = initial[id]; Object.assign(node, { x, y, z, vx: 0, vy: 0, vz: 0, fx: null, fy: null, fz: null }); positions[id] = [x, y, z]; }
  document.querySelector("#layout-status").textContent = "Starting arrangement restored. Reheat to settle it using visible relations.";
  graph.d3ReheatSimulation(); graph.refresh();
}
function reheatLayout() {
  layoutNeedsFit = true;
  const nodes = visibleNodes().length, links = activeEdges().length;
  document.querySelector("#layout-status").textContent = `Settling ${nodes} concepts and ${links} relations with space for icons and midpoint arrows.`;
  configureForces(); graph.d3ReheatSimulation();
}

async function init() {
  try {
    const response = await fetch("/api/ontology"); if (!response.ok) throw new Error(`server responded ${response.status}`);
    db = await response.json(); concepts = db.ontology.concepts; edges = db.ontology.edges; positions = initialLayout();
    relationColors = db.graph_relation_colors;
    conceptGroups = Object.fromEntries(Object.entries(db.graph_concept_styles).map(([id, style]) => [id, colorLabel(style)]));
    colorGroups = Object.fromEntries(Object.values(db.graph_concept_styles).map((style) => [colorLabel(style), style]));
    sizeConfig = db.graph_viewer.default; iconGap = sizeConfig.icon_gap; iconHitPadding = sizeConfig.icon_hit_padding;
    const sizeInput = document.querySelector("#icon-size");
    sizeInput.min = sizeConfig.icon_size_min; sizeInput.max = sizeConfig.icon_size_max; sizeInput.step = sizeConfig.icon_size_step;
    fillControls(); fillColorLegend(); createGraph(); setIconSize(sizeConfig.icon_size, false); document.querySelector("#loading").remove(); draw();
    document.querySelector("#layout-status").textContent = `Settling ${graph.graphData().nodes.length} concepts using ${graph.graphData().links.length} visible relations.`;
    document.querySelector("#search").addEventListener("change", (event) => selectConcept(event.target.value.trim()));
    document.querySelector("#relations").addEventListener("change", () => draw());
    document.querySelector("#clear-relations").addEventListener("click", () => {
      const relations = document.querySelector("#relations");
      for (const option of relations.options) option.selected = false;
      relations.dispatchEvent(new Event("change"));
    });
    document.querySelector("#included").addEventListener("change", () => draw());
    document.querySelector("#show-labels").addEventListener("change", updateVisualState);
    document.querySelector("#find-path").addEventListener("click", shortestPath);
    document.querySelector("#reheat").addEventListener("click", reheatLayout);
    document.querySelector("#restore-layout").addEventListener("click", restoreLayout);
    sizeInput.addEventListener("input", (event) => setIconSize(event.target.value));
    document.querySelector("#reset").addEventListener("click", () => {
      pathEdgeIds.clear(); pathNodeIds.clear(); focusedGroups.clear(); selected = null; document.querySelector("#path-result").innerHTML = "";
      document.querySelector("#details").innerHTML = '<h2>Concept</h2><div class="empty">Select a node in the graph or search for a concept to see its definition, source, and directly connected cited relations.</div>';
      updateVisualState(); graph.zoomToFit(900, sizeConfig.fit_padding);
    });
    document.querySelector("#directed").addEventListener("change", () => { if (pathEdgeIds.size) shortestPath(); });
    window.addEventListener("resize", () => graph.width(document.querySelector("#graph").clientWidth).height(document.querySelector("#graph").clientHeight));
  } catch (error) { document.querySelector("#loading").textContent = `Could not load ontology: ${error.message}`; }
}

if (window.ForceGraph3D && window.d3) init();
else document.querySelector("#loading").textContent = "The 3D graph or force layout library did not load. Check your internet connection and reload.";
