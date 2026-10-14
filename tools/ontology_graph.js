import * as THREE from "https://esm.sh/three";
import { explainPath, collectInfluence } from "./relationship_summary.mjs";
import { loadOntology } from "./ontology_loader.mjs";
import { prepareTours, filterTours, seedTourPositions } from "./guided_tours.mjs";
import { prepareSupport, filterSupportGraph, groundingLabels, witnessLabels, supportLabels, statusLabels } from "./source_support.mjs";
import { createSelectionForce } from "./selection_force.mjs";
import { SVGLoader } from "https://esm.sh/three/examples/jsm/loaders/SVGLoader.js";
import {
  faAppleWhole, faBrain, faCompass, faCross, faCube, faCrown, faDove,
  faEye, faGem, faGift, faHeart, faMedal, faPaw, faPerson,
  faSeedling, faShareNodes, faSun, faWineGlass, faStar, faCloudSun,
  faDoorClosed, faFireFlameCurved, faScaleBalanced, faHandsPraying,
  faHourglassEnd, faPersonRays, faChurch, faBookOpen, faLink, faShieldHalved
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
const selectedStudyAreas = new Set();
let structuralLinkKinds;
let supportIndex, supportFilter = {conceptIds:null,edgeIds:null}, detailSection = "definition";
let tourData, activeTour = null, tourSnapshot = null, tourTransition = 0;
let db, concepts, edges, positions, graph, iconSize, iconGap, iconHitPadding, sizeConfig, activeSignature = "", layoutNeedsFit = false;
let nodeRegistry = {}, nodeVisuals = {}, pathEdgeIds = new Set(), pathNodeIds = new Set(), selected = null, initialTickReported = false;
let selectionRing;
const selectionForce = createSelectionForce();
let suspendedForces = null;
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
  // Scene replacement detaches old meshes until the next render frame.
  selectionRing.visible = Boolean(visual?.parent);
  if (!visual?.parent) return;
  // Engine ticks precede the renderer's node-mesh position update.
  selectionRing.position.set(node.x, node.y, node.z);
  visual.parent.localToWorld(selectionRing.position);
  graph.scene().worldToLocal(selectionRing.position);
  selectionRing.quaternion.copy(graph.camera().quaternion);
  selectionRing.scale.setScalar(iconSize * iconScale(node.id) * selectionRing.userData.extent);
}

function iconScale(id) { return id === "god" ? sizeConfig.god_icon_scale : 1; }
function nodeColor(id) { return colorGroups[conceptGroups[id]].color; }
function colorLabel(entry) { return entry.metadata.category; }
function isFocused(id) { return focusedGroups.has(conceptGroups[id]); }
function applyNodeStyle(id, material) {
  const active = selected === id || pathNodeIds.has(id), focused = isFocused(id);
  const color = material.userData.fixedColor || nodeColor(id);
  material.color.set(color);
  material.emissive.set(color);
  material.emissiveIntensity = (material.userData.baseEmission ?? 0.035) + (active || focused ? sizeConfig.focus_emission : 0);
  material.opacity = focusedGroups.size && !focused && !active ? sizeConfig.dimmed_icon_opacity : 1;
  if (activeTour && !active) material.opacity = sizeConfig.tour_context_opacity;
  material.depthWrite = material.opacity === 1;
}
function incidentToSelection(link) {
  return selected && [link.source.id || link.source, link.target.id || link.target].includes(selected);
}
function relationColor(link, arrow = false) {
  const focused = isFocused(link.source.id || link.source) || isFocused(link.target.id || link.target);
  const path = pathEdgeIds.has(link.edgeId);
  const color = path ? "#ffe08b" : relationColors[link.kind].color;
  const opacity = activeTour ? (path ? 1 : sizeConfig.tour_context_opacity) : path || incidentToSelection(link) ? 1 : focusedGroups.size || selected
    ? (focused ? (arrow ? sizeConfig.arrow_opacity : sizeConfig.focused_relation_opacity) : sizeConfig.dimmed_relation_opacity)
    : (arrow ? sizeConfig.arrow_opacity : sizeConfig.relation_opacity);
  const rgb = color.slice(1).match(/../g).map((v) => parseInt(v, 16));
  return `rgba(${rgb.join(",")},${opacity})`;
}
function relationWidth(link) {
  return pathEdgeIds.has(link.edgeId) || (!activeTour && incidentToSelection(link))
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
  const counts = {}, relationCounts = {};
  for (const node of visibleNodes()) counts[conceptGroups[node.id]] = (counts[conceptGroups[node.id]] || 0) + 1;
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
  if (id === "god") return "divine_majesty";
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
  const distinctive = {
    spiritual_combat: faShieldHalved, spiritual_vigilance: faEye,
    christian_prayer: faHandsPraying, prayer_for_deliverance: faHandsPraying,
    deliverance_from_evil: faDove, demonic_affliction: faCloudSun,
    demonic_oppression: faCloudSun, demonic_possession: faPerson,
    sacramental: faCross, exorcism: faCross, major_exorcism: faCross,
    baptismal_exorcism: faCross, authorized_exorcist: faChurch,
    virgin_mary: faStar, divine_motherhood: faStar, immaculate_conception: faStar,
    heaven: faCloudSun, hell: faDoorClosed, purgatory: faFireFlameCurved,
    purification_from_sin: faFireFlameCurved, human_death: faHourglassEnd,
    particular_judgment: faScaleBalanced, last_judgment: faScaleBalanced,
    resurrection_of_dead: faPersonRays, assumption_of_mary: faCloudSun,
    invocation_of_mary: faHandsPraying, invocation_of_saints: faHandsPraying,
    marian_intercession: faHandsPraying, saints_intercession: faHandsPraying,
    suffrages_for_dead: faHandsPraying, divine_adoration: faHandsPraying,
    church: faChurch, four_marks_of_church: faChurch, apostolic_succession: faLink,
    magisterium: faBookOpen, divine_revelation: faBookOpen, sacred_scripture: faBookOpen,
    sacred_tradition: faBookOpen, deposit_of_faith: faBookOpen,
    christ_passion: faCross, redemption: faCross, christ_resurrection: faPersonRays,
    hypostatic_union: faLink, christ_human_will: faHeart, divine_will: faSun,
    conscience: faScaleBalanced, synderesis: faCompass, natural_law: faScaleBalanced,
    real_presence: faWineGlass, transubstantiation: faWineGlass, eucharistic_sacrifice: faWineGlass,
  };
  if (distinctive[node.id]) return distinctive[node.id];
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

// A single bespoke emblem for God: a gilded triangular aureole and ivory light.
// Fixed proportions define the artwork; presentation controls live in DIPL.
function makeDivineEmblem() {
  const group = new THREE.Group();
  group.name = "divine-majesty-emblem";
  const gold = new THREE.MeshStandardMaterial({ color: sizeConfig.god_icon_color,
    emissive: sizeConfig.god_icon_color, emissiveIntensity: sizeConfig.god_icon_emission,
    metalness: 0.65, roughness: 0.23, transparent: true, depthTest: false,
    side: THREE.DoubleSide });
  const ivory = gold.clone();
  gold.userData = { fixedColor: sizeConfig.god_icon_color, baseEmission: sizeConfig.god_icon_emission };
  ivory.userData = { fixedColor: sizeConfig.god_icon_core_color, baseEmission: sizeConfig.god_icon_emission };
  const triangle = new THREE.Shape();
  const vertices = (radius) => [0, 1, 2].map(i => {
    const angle = Math.PI / 2 + i * Math.PI * 2 / 3;
    return new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius);
  });
  triangle.setFromPoints(vertices(0.34)); triangle.closePath();
  const opening = new THREE.Path(); opening.setFromPoints(vertices(0.265).reverse()); opening.closePath();
  triangle.holes.push(opening);
  const relief = new THREE.ExtrudeGeometry(triangle, {depth: 0.055, bevelEnabled: true,
    bevelThickness: 0.012, bevelSize: 0.009, bevelSegments: 3, steps: 1});
  group.add(new THREE.Mesh(relief, gold));
  for (let i = 0; i < 24; i++) {
    const angle = i * Math.PI / 12, long = i % 2 === 0;
    const ray = new THREE.Shape();
    ray.moveTo(-0.012, 0.365); ray.lineTo(0, long ? 0.51 : 0.445);
    ray.lineTo(0.012, 0.365); ray.lineTo(0, 0.345); ray.closePath();
    const geometry = new THREE.ExtrudeGeometry(ray, {depth: 0.025, bevelEnabled: false});
    geometry.rotateZ(angle);
    group.add(new THREE.Mesh(geometry, gold));
  }
  const heart = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), ivory);
  heart.position.z = 0.075; heart.rotation.set(0.2, 0.3, 0);
  group.add(heart);
  const glowMaterial = new THREE.ShaderMaterial({transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: {color: {value: new THREE.Color(sizeConfig.god_icon_color)},
      opacity: {value: sizeConfig.god_icon_glow_opacity}},
    vertexShader: `varying vec2 glowUv; void main(){glowUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `varying vec2 glowUv; uniform vec3 color; uniform float opacity;
      void main(){ float r=length((glowUv-.5)*2.0);
        float a=exp(-r*r*7.0)*(1.0-smoothstep(.7,1.0,r))*opacity;
        gl_FragColor=vec4(color,a); }`
  });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), glowMaterial);
  glow.name = "divine-radiance"; glow.position.z = -0.04;
  glow.raycast = () => {}; // Light never intercepts another icon's pointer target.
  group.add(glow);
  // Keep this singular emblem legible where its many incident lines converge.
  // Only solid artwork draws above links; the glow remains depth-tested.
  group.children.filter(child => child !== glow).forEach(child => { child.renderOrder = 5; });
  group.userData.glowMaterial = glowMaterial;
  group.userData.iconMaterials = [gold, ivory];
  return group;
}

function styleTourLabel(id, label) {
  const context = activeTour && !pathNodeIds.has(id);
  const gap = sizeConfig.selection_ring_radius + 3 * sizeConfig.selection_ring_width + sizeConfig.label_gap;
  label.material.opacity = context && selected !== id ? sizeConfig.tour_context_opacity : 1;
  // Supporting labels sit above the artwork with one label-height of extra
  // clearance; the main concepts retain their familiar labels underneath.
  label.position.y = context ? gap + sizeConfig.label_height : -gap;
}

function finishSculpture(group, node, materials) {
  group.scale.setScalar(iconSize * iconScale(node.id));
  const label = makeLabelSprite(node.label, iconScale(node.id));
  label.visible = Boolean(activeTour) || document.querySelector('#show-labels').checked || selected === node.id || pathNodeIds.has(node.id);
  styleTourLabel(node.id, label);
  group.add(label);
  group.userData.label = label;
  group.userData.iconMaterial = materials[0];
  group.userData.iconMaterials = materials;
  group.userData.nodeId = node.id;
  materials.forEach(material => applyNodeStyle(node.id, material));
  nodeVisuals[node.id] = group;
  return group;
}

function makeSculpture(node) {
  if (node.id === "god") {
    const group = makeDivineEmblem();
    return finishSculpture(group, node, group.userData.iconMaterials);
  }
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
  return finishSculpture(group, node, [material]);
}

function makeLabelSprite(text, scale = 1) {
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
    const minimumHeight = sizeConfig.label_min_text_pixels * (canvas.height / 48) * worldPerPixel / (iconSize * scale);
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
  ids.forEach((id, i) => { const y = 1 - 2 * (i + .5) / n, r = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5)), j = (positionSeed(id) - .5) * sizeConfig.initial_jitter; pos[id] = [sizeConfig.initial_radius * r * Math.cos(a) + j, sizeConfig.initial_radius * y, sizeConfig.initial_radius * r * Math.sin(a) - j]; });
  return pos;
}
function activeDomains() { return new Set([...document.querySelectorAll("#domains input:checked")].map((x) => x.value)); }
function matchesStudyFocus(id) {
  if (supportFilter.conceptIds && !supportFilter.conceptIds.has(id)) return false;
  const matchesArea = !selectedStudyAreas.size || concepts[id].study_areas.some(area => selectedStudyAreas.has(area));
  return matchesArea && (!document.querySelector("#study-focus").checked || conceptGroups[id] === conceptGroups[sizeConfig.study_focus_concept]);
}

function updateStudyAreas() {
  selectedStudyAreas.clear();
  document.querySelectorAll("#study-areas input:checked").forEach(input => selectedStudyAreas.add(input.value));
  document.querySelector("#study-areas-summary").textContent = `Study areas · ${selectedStudyAreas.size ? `${selectedStudyAreas.size} selected` : "All"}`;
  document.querySelector("#clear-study-areas").hidden = !selectedStudyAreas.size;
  document.querySelector("#study-area-notes").hidden = !selectedStudyAreas.size;
  document.querySelector("#study-area-descriptions").innerHTML = [...selectedStudyAreas].map(id => {
    const area = db.ontology.study_areas[id];
    return `<div class="edge-row"><b>${esc(area.label)}</b><div class="latin">${esc(area.latin_name)}</div><p>${esc(area.description)}</p><p>${esc(area.classification_note)}</p>${citation(db.ontology.sources[area.source_id], area.source_id)}</div>`;
  }).join("");
  clearPathResult();
  if (selected && !matchesStudyFocus(selected)) deselectConcept();
  draw();
}
function activeEdges() {
  if (activeTour?.scene) return activeTour.scene.step.edge_ids.map(id => [id, edges[id]]);
  const selectedRelations = [...document.querySelector("#relations").selectedOptions].map((o) => o.value), domains = activeDomains(), included = document.querySelector("#included").checked;
  return Object.entries(edges).filter(([id, e]) => (!supportFilter.edgeIds || supportFilter.edgeIds.has(id)) && (!included || e.included_in_model) && (!selectedRelations.length || selectedRelations.includes(e.relation)) && concepts[e.subject] && concepts[e.object] && matchesStudyFocus(e.subject) && matchesStudyFocus(e.object) && domains.has(concepts[e.subject].domain) && domains.has(concepts[e.object].domain));
}
function visibleNodes() {
  if (activeTour?.scene) return activeTour.scene.step.concept_ids.map(id => nodeRegistry[id]);
  const domains = activeDomains();
  return Object.entries(concepts).filter(([id, c]) => domains.has(c.domain) && matchesStudyFocus(id)).map(([id, c]) => {
    if (!nodeRegistry[id]) { const [x, y, z] = positions[id]; nodeRegistry[id] = { id, label: c.label, domain: c.domain, category: c.category, x, y, z }; }
    return nodeRegistry[id];
  });
}
function preferredDistance(edge) {
  const base = edge.relation === "is_kind_of" ? sizeConfig.link_distance_kind_of : structuralLinkKinds.has(edge.kind) ? sizeConfig.link_distance_structural : sizeConfig.link_distance_default;
  return sizeConfig.link_spacing * Math.max(base, iconSize * (iconScale(edge.source.id || edge.source) + iconScale(edge.target.id || edge.target)) / 2 + 2 * iconGap + sizeConfig.link_arrow_clearance_ratio * arrowLength());
}
function configureForces() {
  graph.d3Force("link")
    .distance((edge) => preferredDistance(edge))
    .strength((edge) => edge.relation === "is_kind_of" ? sizeConfig.link_strength_kind_of : structuralLinkKinds.has(edge.kind) ? sizeConfig.link_strength_structural : sizeConfig.link_strength_default);
  graph.d3Force("charge").strength(sizeConfig.charge_strength * (iconSize / sizeConfig.icon_size) ** sizeConfig.charge_icon_scale_exponent);
  graph.d3Force("center", d3.forceCenter(0, 0, 0));
  graph.d3Force("collide", d3.forceCollide(node => iconSize * iconScale(node.id) * sizeConfig.collision_icon_radius_ratio + iconGap + arrowLength() * sizeConfig.collision_arrow_clearance_ratio).strength(sizeConfig.collision_strength).iterations(sizeConfig.collision_iterations));
}
function restoreSelectionLayout() {
  selectionForce.restore();
  if (suspendedForces) {
    for (const [name, force] of Object.entries(suspendedForces)) graph.d3Force(name, force);
    suspendedForces = null;
  }
  for (const node of graph.graphData().nodes) positions[node.id] = [node.x, node.y, node.z];
}
function openSelectionSpace() {
  if (!graph || activeTour || !selected || !sizeConfig.selection_repulsion_enabled) return;
  if (!selectionForce.begin(selected, {
    radius: iconSize * iconScale(selected) * sizeConfig.selection_repulsion_radius,
    strength: sizeConfig.selection_repulsion_strength,
    spring: sizeConfig.selection_return_strength,
  })) { closeSelectionSpace(); return; }
  if (!suspendedForces) {
    suspendedForces = Object.fromEntries(["link", "charge", "center", "collide"].map(name => [name, graph.d3Force(name)]));
    for (const name of Object.keys(suspendedForces)) graph.d3Force(name, null);
  }
  document.querySelector("#layout-status").textContent = "Opening space around the selected concept. Deselect to restore its surroundings.";
  graph.d3ReheatSimulation();
}
function closeSelectionSpace() {
  if (!selectionForce.active()) return;
  selectionForce.release();
  document.querySelector("#layout-status").textContent = "Restoring the layout around the deselected concept…";
  graph.d3ReheatSimulation();
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
    visual.userData.iconMaterials.forEach(material => applyNodeStyle(id, material));
    if (visual.userData.glowMaterial) visual.userData.glowMaterial.uniforms.opacity.value =
      sizeConfig.god_icon_glow_opacity * visual.userData.iconMaterial.opacity;
    const label = visual.userData.label;
    if (label) {
      label.visible = Boolean(activeTour) || showAll || active;
      styleTourLabel(id, label);
    }
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
    restoreSelectionLayout();
    activeSignature = signature;
    layoutNeedsFit = true;
    graph.graphData({ nodes, links });
    configureForces();
    if (reheatChanged) graph.d3ReheatSimulation();
  }
  if (selected) showDetails(selected);
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
    .onNodeClick((node) => { if (selected === node.id) deselectConcept(); else selectConcept(node.id); })
    .onNodeHover((node) => { el.style.cursor = node ? "pointer" : "grab"; })
    .onEngineTick(() => { if (activeTour) { syncBillboards(); return; } const active = visibleNodes(); for (const n of active) positions[n.id] = [n.x, n.y, n.z]; if (!initialTickReported && active.length) { const extent = ["x", "y", "z"].map((axis) => (Math.max(...active.map((n) => n[axis])) - Math.min(...active.map((n) => n[axis]))).toFixed(1)).join(" × "); document.querySelector("#layout-status").textContent = `Settling ${active.length} concepts · initial spread ${extent}.`; initialTickReported = true; } syncBillboards(); })
    .onEngineStop(() => { if (activeTour) { settleTourView(); return; } if (selectionForce.returning()) restoreSelectionLayout(); const settled = visibleNodes(); for (const n of settled) positions[n.id] = [n.x, n.y, n.z]; const span = settled.length ? Math.max(...["x", "y", "z"].map((axis) => Math.max(...settled.map((n) => n[axis])) - Math.min(...settled.map((n) => n[axis])))).toFixed(1) : "0"; document.querySelector("#layout-status").textContent = `Layout settled · ${settled.length} concepts · span ${span}. Change filters or icon size to anneal again.`; if (layoutNeedsFit) { graph.zoomToFit(700, sizeConfig.fit_padding); layoutNeedsFit = false; } if (selected && !selectionForce.active()) openSelectionSpace(); });
  graph.d3AlphaDecay(sizeConfig.alpha_decay).d3AlphaMin(sizeConfig.alpha_min).d3VelocityDecay(sizeConfig.velocity_decay).cooldownTime(sizeConfig.cooldown_ms);
  graph.d3Force("selection-space", selectionForce);
  graph.scene().add(new THREE.AmbientLight(0x9fb1c7, 1.7));
  const key = new THREE.DirectionalLight(0xffefd1, 2.4); key.position.set(-9, 12, 15); graph.scene().add(key);
  const fill = new THREE.DirectionalLight(0x94c9ff, 1.25); fill.position.set(8, -5, 10); graph.scene().add(fill);
  createSelectionRing();
  graph.controls().addEventListener("change", syncBillboards);
  graph.cameraPosition({ x: 25, y: 18, z: 29 }, { x: 0, y: 0, z: 0 }, 0);
}

function selectConcept(id) {
  if (!concepts[id] || (activeTour && !activeTour.scene.conceptIds.has(id))) return;
  selected = id;
  document.querySelector("#search").value = id;
  showDetails(id); updateVisualState();
  openSelectionSpace();
}
function deselectConcept() {
  selected = null;
  document.querySelector("#search").value = "";
  document.querySelector("#details").innerHTML = '<h2>Concept</h2><div class="empty">Select a node in the graph or search for a concept to see its definition, source, and directly connected cited relations.</div>';
  updateVisualState();
  closeSelectionSpace();
}
function supportMarkup(kind, id) {
  const records = supportIndex[kind].get(id) || [];
  return records.map(r => `<article class="support-record" data-support-record="${esc(r.id)}"><p><b>${esc(r.claim)}</b></p>
    <div>${r.grounding.map(g=>`<span class="tag">${esc(groundingLabels[g])}</span>`).join('')}<span class="tag">${esc(supportLabels[r.support_kind])}</span><span class="tag">${esc(r.review_status)}</span></div>
    <p>${esc(db.support_rationales[r.id])}</p><p class="summary-qualification">${esc(r.qualification)}</p>
    ${citation(db.ontology.sources[r.source_id],r.source_id)}
    <div class="small">${esc(statusLabels[r.doctrinal_status])}</div>
    ${r.status_source_id && r.status_source_id!==r.source_id ? citation(db.ontology.sources[r.status_source_id],r.status_source_id) : ''}</article>`).join('');
}
function edgeSupportMarkup(id) {
  const count = supportIndex.edge.get(id)?.length || 0;
  return count ? `<details class="support-evidence"><summary>Grounding and historical support (${count})</summary>${supportMarkup('edge',id)}</details>` : '';
}
function showDetails(id) {
  const c = concepts[id], source = db.ontology.sources[c.source_id];
  const incident = activeEdges().filter(([, e]) => e.subject === id || e.object === id);
  if (detailSection === "principles" && !Object.values(db.ontology.relations).some(r=>r.principle_id===id)) detailSection="definition";
  const section = (key,title,body) => `<details class="concept-section" name="concept-sections" data-concept-section="${key}" ${detailSection===key?'open':''}><summary>${title}</summary><div class="concept-section-body">${body}</div></details>`;
  let html = `<div class="concept-panel-header"><h2>Concept</h2><button type="button" id="deselect-concept" aria-label="Deselect concept" title="Deselect concept">×</button></div><div class="detail-title">${esc(c.label)}</div><div class="latin">${esc(c.latin_name)}</div><div class="id">${esc(id)}</div>`;
  html += section('definition','Definition',`<span class="tag">${esc(c.domain)}</span><span class="tag">${esc(c.category.replaceAll('_',' '))}</span><span class="tag">${esc(c.review_status)}</span><div class="note">${esc(c.note)}</div>${citation(source,c.source_id)}`);
  const support = supportIndex.concept.get(id) || [];
  html += section('grounding',`Grounding and sources · ${support.length}`,support.length ? `<p class="hint">Assessments apply to the stated claims. Other aspects may remain unassessed.</p>${supportMarkup('concept',id)}` : `<p class="note">Grounding has not yet been assessed for this definition. This does not mean it lacks scriptural or philosophical support.</p>${citation(source,c.source_id)}`);
  html += section('studies','Study areas',c.study_areas.map(area => `<span class="tag" title="${esc(db.ontology.study_areas[area].description)}">${esc(db.ontology.study_areas[area].label)}</span>`).join('')+'<div class="hint">Editorial study groupings; a concept can belong to several areas.</div>');
  const groundedRelations = Object.values(db.ontology.relations).filter(r=>r.principle_id===id);
  if (groundedRelations.length) html += section('principles',`Relations using this principle · ${groundedRelations.length}`,groundedRelations.map(r=>`<div class="edge-row"><b>${esc(r.label)}</b><p>${esc(r.description)}</p></div>`).join(''));
  const relations = incident.map(([edgeId,e])=>{
    const outgoing=e.subject===id, other=outgoing?e.object:e.subject;
    const qualifiers=[['Recipient',e.recipient_scope],['Aspect',e.affected_aspect],['Causality',e.causal_mode]].filter(([,v])=>v&&v!=='unspecified').map(([name,v])=>`<span class="tag">${name}: ${esc(v.replaceAll('_',' '))}</span>`).join('');
    const principleId=db.ontology.relations[e.relation]?.principle_id;
    const principle=concepts[principleId]?`<div>Principle: <button data-node="${esc(principleId)}">${esc(concepts[principleId].label)}</button></div>`:'';
    const condition=e.conditions?`<div><b>Conditions:</b> ${esc(e.conditions)}</div>${citation(db.ontology.sources[e.condition_source_id],e.condition_source_id)}`:'';
    return `<details class="edge-row" data-edge="${esc(edgeId)}"><summary>${outgoing?'→':'←'} ${esc(db.ontology.relations[e.relation]?.label||e.relation)} · ${esc(concepts[other].label)}</summary><button data-node="${esc(other)}">Open ${esc(concepts[other].label)}</button>${principle}<p>${esc(db.rationales?.[edgeId]||'')}</p>${qualifiers}${citation(db.ontology.sources[e.source_id],e.source_id)}${condition}${edgeSupportMarkup(edgeId)}</details>`;
  }).join('');
  html += section('relations',`Connected relations · ${incident.length}`,relations || '<div class="empty">No connected relations are displayed with the current filters.</div>');
  const panel=document.querySelector('#details'); panel.innerHTML=html;
  panel.querySelectorAll('[data-concept-section]').forEach(element=>element.addEventListener('toggle',()=>{
    if(element.open) detailSection=element.dataset.conceptSection;
  }));
  panel.querySelector('#deselect-concept').addEventListener('click',()=>{deselectConcept();document.querySelector('#search').focus({preventScroll:true});});
  panel.querySelectorAll('[data-node]').forEach(button=>button.addEventListener('click',()=>selectConcept(button.dataset.node)));
}
function citation(source, id) {
  if (!source) return `<span class="small">Source: ${esc(id || "unknown")}</span>`;
  const witness = witnessLabels[source.witness_kind];
  const authority = {
    church_guidance: "Official ecclesial guidance or discipline",
    pastoral_literature: "Pastoral literature · not magisterial teaching",
  }[source.authority_kind];
  return `<div class="citation">${witness ? `<small>${esc(witness)}</small><br>` : ""}${authority ? `<small>${esc(authority)}</small><br>` : ""}<b>${esc(source.author)}</b>, <i>${esc(source.work)}</i>, ${esc(source.locator)}${source.translation ? `<br>${esc(source.translation)}` : ""}${source.date_note ? `<br>${esc(source.date_note)}` : ""}<br><a href="${esc(source.url)}" target="_blank" rel="noopener">Open source ↗</a></div>`;
}
function clearPathResult() {
  pathEdgeIds.clear(); pathNodeIds.clear();
  const output = document.querySelector("#path-result");
  output.replaceChildren(); output.className = "";
  const summary = document.querySelector("#relationship-summary");
  summary.replaceChildren(); summary.hidden = true;
  document.querySelector("#connection-summary").hidden = true;
  document.querySelector("#disconnect").disabled = true;
}
function influenceOverview(start, end) {
  if (start === end) return "";
  const available = activeEdges().map(([id]) => id);
  const item = step => {
    const e = step.edge;
    return `<div class="summary-claim"><span class="tag">${esc(e.review_status)}</span>${e.evidence_kind !== "textual_paraphrase" ? `<span class="tag">${esc(e.evidence_kind.replaceAll("_", " "))}</span>` : ""}<p>${esc(step.sentence)} ${esc(step.rationale)}</p>${e.recipient_scope && e.recipient_scope !== "unspecified" ? `<div class="summary-qualification">Recipient scope: ${esc(e.recipient_scope.replaceAll("_", " "))}.</div>` : ""}${e.conditions ? `<div class="summary-qualification"><b>Conditions:</b> ${esc(e.conditions)}</div>` : ""}<details class="influence-citation"><summary>Source and relation meaning</summary><p>${esc(step.description)}</p>${citation(step.source, e.source_id)}${edgeSupportMarkup(step.id)}${e.conditions ? `<div class="small">Condition source:</div>${citation(step.conditionSource, e.condition_source_id)}` : ""}<div class="small">Edge: ${esc(step.id)} · ${esc(e.causal_mode.replaceAll("_", " "))}</div></details></div>`;
  };
  const directions = [[start, end], [end, start]].map(([from, to]) => {
      const result = collectInfluence(db, from, to, available, sizeConfig.influence_summary_depth);
      const all = [...result.statements, ...result.limits];
      if (!all.length) return "";
      const prose = statements => [...new Set(statements.map(step => step.rationale || step.sentence))].map(esc).join(" ");
      const statuses = [...new Set(all.map(step => step.edge.review_status))].map(status => `<span class="tag">${esc(status)}</span>`).join("");
      const qualifications = [...new Set(all.map(step => step.edge.conditions).filter(Boolean))];
      return `<h3>${esc(concepts[from].label)} → ${esc(concepts[to].label)}</h3>`
        + statuses + (all.some(step => step.edge.evidence_kind === "interpretive_inference") ? '<span class="tag">Includes interpretive inference</span>' : "")
        + (result.statements.length ? `<p>${prose(result.statements)}</p>` : "")
        + (result.limits.length ? `<p><b>Limits:</b> ${prose(result.limits)}</p>` : "")
        + qualifications.map(text => `<p class="summary-qualification"><b>Condition:</b> ${esc(text)}</p>`).join("")
        + (all.length ? `<details class="influence-statements"><summary>Read the cited influence statements (${all.length})</summary>${result.statements.map(item).join("")}${result.limits.length ? `<h3>Limits</h3>${result.limits.map(item).join("")}` : ""}</details>` : "");
    }).join("");
  return directions ? `<section class="influence-overview"><h2>Influence overview</h2><p class="summary-route">Cited capacities, effects, and limits. These describe possibilities under the stated conditions, not an inevitable causal chain.</p>${directions}</section>` : "";
}
function showRelationshipSummary(ordered, edgeIds, start = ordered[0], end = ordered.at(-1)) {
  const { steps, labels } = ordered.length ? explainPath(db, ordered, edgeIds) : { steps: [], labels: [] };
  const panel = document.querySelector("#relationship-summary");
  panel.hidden = false;
  const bubble = document.querySelector("#connection-summary");
  bubble.hidden = false; bubble.open = true; bubble.scrollTop = 0;
  const route = !ordered.length ? "No graph path is available under these filters. Explicit recipient-scoped statements may still describe influence."
    : steps.length === 0 ? "The same concept is selected at both ends; no relation is traversed."
    : steps.length === 1 ? "A direct connection in the selected path."
    : `An indirect connection through ${labels.slice(1, -1).join(" → ")}. These steps do not establish a further direct or causal relation between the endpoints.`;
  panel.innerHTML = influenceOverview(start, end) + `<h2>Path explanation</h2><div class="summary-route">${esc(route)}</div>`
    + steps.map((step, i) => {
      const e = step.edge;
      const evidence = e.evidence_kind === "textual_paraphrase" ? "" : `<span class="tag">${esc(e.evidence_kind.replaceAll("_", " "))}</span>`;
      const scope = e.recipient_scope && e.recipient_scope !== "unspecified"
        ? `<div class="summary-qualification">Recipient scope: ${esc(e.recipient_scope.replaceAll("_", " "))}.</div>` : "";
      const conditions = e.conditions ? `<div class="summary-qualification"><b>Conditions:</b> ${esc(e.conditions)}</div>` : "";
      return `<div class="summary-claim">${evidence}<span class="tag">${esc(e.review_status)}</span><p>${esc(step.sentence)} ${esc(step.rationale)} <a href="#relationship-step-${i}" data-summary-step="${i}" aria-label="Sources for statement ${i + 1}">[${i + 1}]</a></p>${scope}${conditions}</div>`;
    }).join("")
    + (steps.length ? `<details class="summary-evidence"><summary>Read the cited steps (${steps.length})</summary><ol>${steps.map((step, i) => {
      const e = step.edge;
      const qualifiers = [["Aspect", e.affected_aspect], ["Causality", e.causal_mode]]
        .filter(([, value]) => value && value !== "unspecified")
        .map(([name, value]) => `<span class="tag">${name}: ${esc(value.replaceAll("_", " "))}</span>`).join("");
      return `<li id="relationship-step-${i}"><b>${esc(step.sentence)}</b><p>${esc(step.description)}</p>${step.reversed ? '<p class="summary-qualification">This step is traversed backward. The statement keeps the original direction of the cited relation.</p>' : ""}${qualifiers}${citation(step.source, e.source_id)}${edgeSupportMarkup(step.id)}${e.conditions ? `<div class="summary-qualification">Condition source:</div>${citation(step.conditionSource, e.condition_source_id)}` : ""}<div class="small">Edge: ${esc(step.id)} · ${esc(e.evidence_kind.replaceAll("_", " "))} · ${esc(e.review_status)}</div></li>`;
    }).join("")}</ol></details>` : "");
  panel.querySelectorAll("[data-summary-step]").forEach(link => link.addEventListener("click", event => {
    event.preventDefault();
    panel.querySelector(".summary-evidence").open = true;
    panel.querySelector(`#relationship-step-${link.dataset.summaryStep}`).scrollIntoView({ block: "nearest" });
  }));
}
function updateSupportFilter() {
  supportFilter=filterSupportGraph(db,supportIndex,{
    grounding:document.querySelector('#grounding-filter').value,
    witness:document.querySelector('#witness-filter').value,
    support:document.querySelector('#support-filter').value,
  });
  clearPathResult();
  if (selected && !matchesStudyFocus(selected)) deselectConcept();
  draw();
}
function fillControls() {
  for(const [id,labels] of [['grounding-filter',groundingLabels],['witness-filter',witnessLabels],['support-filter',supportLabels]]) {
    const select=document.querySelector('#'+id);
    select.innerHTML='<option value="">All</option>'+Object.entries(labels).map(([value,label])=>`<option value="${value}">${esc(label)}</option>`).join('');
    select.addEventListener('change',updateSupportFilter);
  }
  document.querySelector('#clear-grounding').addEventListener('click',()=>{
    for(const id of ['grounding-filter','witness-filter','support-filter'])document.querySelector('#'+id).value='';
    updateSupportFilter();
  });
  const list = document.querySelector("#concept-list"), from = document.querySelector("#from"), to = document.querySelector("#to");
  for (const [id, c] of Object.entries(concepts).sort((a, b) => a[1].label.localeCompare(b[1].label))) {
    const option = document.createElement("option"); option.value = id; option.label = `${c.label} · ${id}`; list.append(option);
    for (const select of [from, to]) { const item = document.createElement("option"); item.value = id; item.textContent = c.label; select.append(item); }
  }
  from.value = "god"; to.value = "human_person";
  const domains = [...new Set(Object.values(concepts).map((c) => c.domain))].sort();
  document.querySelector("#domains").innerHTML = domains.map((domain) => `<label class="check"><input type="checkbox" value="${esc(domain)}" checked>${esc(domain)}</label>`).join("");
  document.querySelectorAll("#domains input").forEach((input) => input.addEventListener("change", () => { clearPathResult(); draw(); }));
  document.querySelector("#study-areas").innerHTML = Object.entries(db.ontology.study_areas)
    .sort((a, b) => a[1].label.localeCompare(b[1].label))
    .map(([id, area]) => {
      const count = Object.values(concepts).filter(c => c.study_areas.includes(id)).length;
      return `<label class="check"><input type="checkbox" value="${esc(id)}">${esc(area.label)} <span class="small">(${count})</span></label>`;
    }).join("");
  document.querySelectorAll("#study-areas input").forEach(input => input.addEventListener("change", updateStudyAreas));
  document.querySelector("#clear-study-areas").addEventListener("click", () => {
    document.querySelectorAll("#study-areas input").forEach(input => { input.checked = false; });
    updateStudyAreas();
  });
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
  clearPathResult(); const output = document.querySelector("#path-result");
  document.querySelector("#disconnect").disabled = false;
  const domains = activeDomains();
  const endpointsVisible = [start, end].every(id => domains.has(concepts[id].domain) && matchesStudyFocus(id));
  if (!Object.hasOwn(previous, end) || !endpointsVisible) {
    output.className = "path-result none"; output.textContent = `No path found from “${concepts[start].label}” to “${concepts[end].label}” with these filters.`;
    if (endpointsVisible) showRelationshipSummary([], [], start, end);
    updateVisualState(); return;
  }
  const ordered = [end]; let current = end; pathNodeIds.add(current);
  while (current !== start) { const step = previous[current]; pathEdgeIds.add(step.edge); current = step.from; pathNodeIds.add(current); ordered.push(current); }
  ordered.reverse(); const relations = ordered.slice(1).map((id) => db.ontology.relations[edges[previous[id].edge].relation]?.label || edges[previous[id].edge].relation);
  output.className = "path-result";
  output.innerHTML = `${ordered.length - 1} edge${ordered.length === 2 ? "" : "s"}:<br>${ordered.map((id, i) => {
    if (i >= relations.length) return esc(concepts[id].label);
    const forward = edges[previous[ordered[i + 1]].edge].subject === id;
    return `${esc(concepts[id].label)} <span style="color:#ffe08b">${forward ? "—" : "←"}${esc(relations[i])}${forward ? "→" : "—"}</span><br>`;
  }).join("")}`;
  showRelationshipSummary(ordered, ordered.slice(1).map(id => previous[id].edge));
  updateVisualState();
}
function setIconSize(value, anneal = true) {
  if (graph) restoreSelectionLayout();
  iconSize = Number(value);
  document.querySelector("#icon-size").value = String(iconSize);
  document.querySelector("#icon-size-value").value = iconSize.toFixed(2);
  for (const visual of Object.values(nodeVisuals)) visual.scale.setScalar(iconSize * iconScale(visual.userData.nodeId));
  syncSelectionRing();
  if (anneal) layoutNeedsFit = true;
  if (graph) { configureForces(); graph.linkDirectionalArrowLength(arrowLength); if (anneal) graph.d3ReheatSimulation(); graph.refresh(); }
}
function restoreLayout() {
  if (activeTour) { applyTourStep(activeTour.index); return; }
  restoreSelectionLayout();
  const initial = initialLayout();
  for (const [id, node] of Object.entries(nodeRegistry)) { const [x, y, z] = initial[id]; Object.assign(node, { x, y, z, vx: 0, vy: 0, vz: 0, fx: null, fy: null, fz: null }); positions[id] = [x, y, z]; }
  document.querySelector("#layout-status").textContent = "Starting arrangement restored. Reheat to settle it using visible relations.";
  graph.d3ReheatSimulation(); graph.refresh();
}
function reheatLayout() {
  restoreSelectionLayout();
  layoutNeedsFit = true;
  const nodes = visibleNodes().length, links = activeEdges().length;
  document.querySelector("#layout-status").textContent = `Settling ${nodes} concepts and ${links} relations with space for icons and midpoint arrows.`;
  configureForces(); graph.d3ReheatSimulation();
}

function settleTourView() {
  syncBillboards();
  document.querySelector('#layout-status').textContent = 'Guided tour · 3D layout settled. Rotate, drag concepts, or Reheat to explore the connections.';
  if (layoutNeedsFit) {
    graph.zoomToFit(reducedMotion.matches ? 0 : sizeConfig.tour_transition_ms, sizeConfig.fit_padding);
    layoutNeedsFit = false;
  }
}

function renderTourCatalogue() {
  const audience = document.querySelector('#tour-audience').value;
  const topic = document.querySelector('#tour-topic').value;
  const rows = filterTours(tourData.tours, {audience, topic});
  document.querySelector('#tour-match-count').textContent = `${rows.length} of ${Object.keys(tourData.tours).length} tours`;
  document.querySelector('#tour-catalogue-list').innerHTML = rows.map(([id, tour]) =>
    `<article class="tour-card"><h3>${esc(tour.title)}</h3><p>${esc(tour.description)}</p><div>${tour.audience_tags.map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div><div class="small">${tour.topic_tags.map(esc).join(' · ')} · ${tour.step_ids.length} steps</div><button type="button" data-tour="${esc(id)}">Start tour</button></article>`
  ).join('') || '<p class="empty">No tours match these filters. Choose another topic or all audiences.</p>';
  document.querySelectorAll('[data-tour]').forEach(button => button.addEventListener('click', () => startTour(button.dataset.tour)));
}
function initializeTours() {
  document.querySelector("#tour-catalogue-title").textContent = `Guided tours · ${Object.keys(tourData.tours).length} tours`;
  const audiences = [...new Set(Object.values(tourData.tours).flatMap(tour => tour.audience_tags))].sort();
  document.querySelector('#tour-audience').innerHTML = '<option value="">All audiences</option>' + audiences.map(tag => `<option value="${esc(tag)}">${esc(tag)}</option>`).join('');
  document.querySelector('#tour-audience').addEventListener('change', renderTourCatalogue);
  const topics = [...new Set(Object.values(tourData.tours).flatMap(tour => tour.topic_tags))].sort();
  document.querySelector('#tour-topic').innerHTML = '<option value="">All topics</option>' + topics.map(tag => `<option value="${esc(tag)}">${esc(tag)}</option>`).join('');
  document.querySelector('#tour-topic').addEventListener('change', renderTourCatalogue);
  document.querySelector('#tour-exit').addEventListener('click', () => exitTour());
  document.querySelector('#tour-previous').addEventListener('click', () => applyTourStep(activeTour.index - 1));
  document.querySelector('#tour-next').addEventListener('click', () => {
    if (activeTour.index + 1 === tourData.tours[activeTour.id].step_ids.length) exitTour(true);
    else applyTourStep(activeTour.index + 1);
  });
  renderTourCatalogue();
}
function startTour(id) {
  if (!tourData.tours[id]) return;
  if (activeTour) exitTour();
  tourTransition++;
  restoreSelectionLayout();
  const savedNodes = {};
  for (const key of Object.keys(concepts)) {
    const node = nodeRegistry[key], [x, y, z] = positions[key];
    savedNodes[key] = node ? Object.fromEntries(['x','y','z','vx','vy','vz','fx','fy','fz'].map(field => [field, node[field]])) : {x, y, z, vx:0, vy:0, vz:0, fx:null, fy:null, fz:null};
  }
  const camera = graph.camera().position, target = graph.controls().target;
  const controls = [...document.querySelectorAll('#explore-controls input, #explore-controls select, #explore-controls button, .layout-controls input, .layout-controls button')];
  tourSnapshot = {
    nodes: savedNodes, selected, iconSize, focused: [...focusedGroups],
    hadPath: Boolean(document.querySelector('#path-result').textContent),
    camera: {x:camera.x,y:camera.y,z:camera.z}, target:{x:target.x,y:target.y,z:target.z},
    nodeDrag: graph.enableNodeDrag(), cooldownTicks: graph.cooldownTicks(),
    controls: controls.map(control => [control, control.disabled]),
    legends: [...document.querySelectorAll('.graph-legends details')].map(panel => [panel, panel.open]),
    sidebar: [...document.querySelectorAll('.sidebar-accordion')].map(panel => [panel, panel.open]),
    forces: Object.fromEntries(['link','charge','center','collide'].map(name => [name, graph.d3Force(name)])),
  };
  controls.forEach(control => { control.disabled = !control.closest('.layout-controls'); });
  tourSnapshot.legends.forEach(([panel]) => { panel.open = false; });
  graph.enableNodeDrag(true).cooldownTicks(Infinity);
  clearPathResult(); focusedGroups.clear(); selected = null;
  activeTour = { id, index: 0, scene: null };
  document.body.classList.add('tour-mode');
  document.querySelector('#tour-catalogue').open = true;
  document.querySelector('#tour-catalogue-content').hidden = true;
  document.querySelector('#explore-controls').hidden = true;
  document.querySelector('#tour-player').hidden = false;
  setIconSize(sizeConfig.tour_icon_size, false);
  applyTourStep(0);
}
function applyTourStep(index) {
  if (!activeTour) return;
  const tour = tourData.tours[activeTour.id];
  if (index < 0 || index >= tour.step_ids.length) return;
  const scene = tourData.scenes[tour.step_ids[index]], step = scene.step;
  activeTour.index = index; activeTour.scene = scene;
  clearPathResult();
  for (const id of step.highlighted_edge_ids) pathEdgeIds.add(id);
  for (const id of step.highlighted_concept_ids) pathNodeIds.add(id);
  const seeded = seedTourPositions(scene, iconSize * sizeConfig.tour_depth_ratio);
  for (const id of step.concept_ids) {
    const c = concepts[id], [x,y,z] = seeded[id];
    nodeRegistry[id] ||= {id, label:c.label, domain:c.domain, category:c.category};
    Object.assign(nodeRegistry[id], {x,y,z,fx:null,fy:null,fz:null,vx:0,vy:0,vz:0});
    positions[id] = [x,y,z];
  }
  selected = step.focus_concept;
  document.querySelector('#tour-name').textContent = tour.title;
  document.querySelector('#tour-progress').textContent = `Step ${index + 1} of ${tour.step_ids.length}`;
  document.querySelector('#tour-step-title').textContent = step.title;
  document.querySelector('#tour-question').textContent = step.question;
  document.querySelector('#tour-narrative').textContent = step.narrative;
  document.querySelector('#tour-qualification').textContent = step.qualification;
  document.querySelector('#tour-sources').innerHTML = step.source_ids.map(id => citation(db.ontology.sources[id], id)).join('');
  document.querySelector('#tour-framing').textContent = tour.framing_note;
  document.querySelector('#tour-review').textContent = `Editorial review: ${tour.review_status}`;
  document.querySelector('#tour-previous').disabled = index === 0;
  document.querySelector('#tour-next').textContent = index + 1 === tour.step_ids.length ? 'Finish tour' : 'Next';
  draw(false); configureForces(); layoutNeedsFit = true;
  graph.cameraPosition({x:step.camera_x,y:step.camera_y,z:step.camera_z}, {x:step.look_at_x,y:step.look_at_y,z:step.look_at_z}, reducedMotion.matches ? 0 : sizeConfig.tour_transition_ms);
  graph.d3ReheatSimulation();
  document.querySelector('#layout-status').textContent = 'Guided tour · relaxing in 3D with space for icons and arrows; quieter concepts provide context.';
  document.querySelector('#tour-step-title').focus({preventScroll:true});
}
function exitTour(completed = false) {
  if (!activeTour) return;
  const saved = tourSnapshot, token = ++tourTransition;
  const tourId = activeTour.id, title = tourData.tours[tourId].title;
  activeTour = null; tourSnapshot = null;
  clearPathResult();
  for (const [id, state] of Object.entries(saved.nodes)) {
    if (nodeRegistry[id]) Object.assign(nodeRegistry[id], state);
    positions[id] = [state.x,state.y,state.z];
  }
  for (const [name, force] of Object.entries(saved.forces)) graph.d3Force(name, force);
  graph.enableNodeDrag(saved.nodeDrag);
  // Stop the scene-change reheat so the restored exploration layout stays put.
  graph.cooldownTicks(0);
  saved.controls.forEach(([control, disabled]) => { control.disabled = disabled; });
  saved.legends.forEach(([panel, open]) => { panel.open = open; });
  focusedGroups.clear(); saved.focused.forEach(id => focusedGroups.add(id));
  selected = saved.selected;
  document.body.classList.remove('tour-mode');
  document.querySelector('#tour-catalogue-content').hidden = false;
  saved.sidebar.forEach(([panel, open]) => { panel.open = open; });
  document.querySelector('#explore-controls').hidden = false;
  document.querySelector('#tour-player').hidden = true;
  setIconSize(saved.iconSize, false);
  draw(false); layoutNeedsFit = false;
  if (selected) { document.querySelector('#search').value = selected; showDetails(selected); }
  else deselectConcept();
  if (saved.hadPath) shortestPath();
  graph.cameraPosition(saved.camera, saved.target, reducedMotion.matches ? 0 : sizeConfig.tour_transition_ms);
  document.querySelector('#layout-status').textContent = completed ? `Completed “${title}”. Your exploration view is restored.` : 'Your exploration view is restored.';
  // Wait for a rendered frame to observe the stop before restoring its budget.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (token !== tourTransition) return;
    graph.cooldownTicks(saved.cooldownTicks);
    if (selected) openSelectionSpace();
  }));
  document.querySelector(`[data-tour="${tourId}"]`)?.focus({preventScroll:true});
}

async function init() {
  try {
    db = await loadOntology(message => { document.querySelector("#loading").textContent = message; });
    concepts = db.ontology.concepts; edges = db.ontology.edges; tourData = prepareTours(db); supportIndex = prepareSupport(db);
    relationColors = db.graph_relation_colors;
    conceptGroups = Object.fromEntries(Object.entries(db.graph_concept_styles).map(([id, style]) => [id, colorLabel(style)]));
    colorGroups = Object.fromEntries(Object.values(db.graph_concept_styles).map((style) => [colorLabel(style), style]));
    sizeConfig = db.graph_viewer.default; iconGap = sizeConfig.icon_gap; iconHitPadding = sizeConfig.icon_hit_padding;
    structuralLinkKinds = new Set(sizeConfig.structural_link_kinds);
    for (const kind of structuralLinkKinds) if (!Object.hasOwn(relationColors, kind)) throw new Error(`Unknown structural link kind: ${kind}`);
    positions = initialLayout();
    const studyConcept = concepts[sizeConfig.study_focus_concept];
    if (!studyConcept) throw new Error("Unknown DIPL study_focus_concept");
    const studyFocus = document.querySelector("#study-focus"), studyNote = document.querySelector("#study-focus-note");
    studyFocus.checked = sizeConfig.study_focus_enabled;
    document.querySelector("#study-focus-label").textContent = `Focus: ${studyConcept.label}`;
    studyNote.innerHTML = `${esc(studyConcept.note)}${citation(db.ontology.sources[studyConcept.source_id], studyConcept.source_id)}<div class="hint">Other filters still apply. Turn off focus to explore connections with the wider ontology.</div>`;
    studyNote.hidden = !studyFocus.checked;
    const sizeInput = document.querySelector("#icon-size");
    sizeInput.min = sizeConfig.icon_size_min; sizeInput.max = sizeConfig.icon_size_max; sizeInput.step = sizeConfig.icon_size_step;
    fillControls(); initializeTours(); fillColorLegend(); createGraph(); setIconSize(sizeConfig.icon_size, false); document.querySelector("#loading").remove(); draw();
    document.querySelector("#layout-status").textContent = `Settling ${graph.graphData().nodes.length} concepts using ${graph.graphData().links.length} visible relations.`;
    document.querySelector("#search").addEventListener("change", (event) => {
      const id = event.target.value.trim();
      if (id) selectConcept(id); else deselectConcept();
    });
    document.querySelector("#relations").addEventListener("change", () => { clearPathResult(); draw(); });
    document.querySelector("#clear-relations").addEventListener("click", () => {
      const relations = document.querySelector("#relations");
      for (const option of relations.options) option.selected = false;
      relations.dispatchEvent(new Event("change"));
    });
    document.querySelector("#included").addEventListener("change", () => { clearPathResult(); draw(); });
    for (const id of ["from", "to"]) document.querySelector(`#${id}`).addEventListener("change", () => { clearPathResult(); updateVisualState(); });
    document.querySelector("#show-labels").addEventListener("change", updateVisualState);
    studyFocus.addEventListener("change", () => {
      clearPathResult(); studyNote.hidden = !studyFocus.checked; draw();
      if (studyFocus.checked) selectConcept(sizeConfig.study_focus_concept);
    });
    document.querySelector("#find-path").addEventListener("click", shortestPath);
    document.querySelector("#disconnect").addEventListener("click", () => { clearPathResult(); updateVisualState(); });
    document.querySelector("#reheat").addEventListener("click", reheatLayout);
    document.querySelector("#restore-layout").addEventListener("click", restoreLayout);
    sizeInput.addEventListener("input", (event) => setIconSize(event.target.value));
    document.querySelector("#reset").addEventListener("click", () => {
      if (activeTour) { applyTourStep(activeTour.index); return; }
      for(const id of ['grounding-filter','witness-filter','support-filter'])document.querySelector('#'+id).value='';
      supportFilter={conceptIds:null,edgeIds:null};
      studyFocus.checked = false; studyNote.hidden = true;
      clearPathResult(); focusedGroups.clear(); deselectConcept();
      draw();
      graph.zoomToFit(900, sizeConfig.fit_padding);
    });
    document.querySelector("#directed").addEventListener("change", () => { if (document.querySelector("#path-result").textContent) shortestPath(); });
    new ResizeObserver(() => {
      const el = document.querySelector("#graph");
      graph.width(el.clientWidth).height(el.clientHeight);
    }).observe(document.querySelector("#graph"));
  } catch (error) { document.querySelector("#loading").textContent = `Could not load ontology: ${error.message}`; }
}

if (window.ForceGraph3D && window.d3) init();
else document.querySelector("#loading").textContent = "The 3D graph or force layout library did not load. Check your internet connection and reload.";
