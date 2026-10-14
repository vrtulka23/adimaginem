# Ad Imaginem ontology graph explorer

The same interactive graph runs in two modes. Both use the canonical DIPL ontology and preserve citations, rationale metadata, display settings, filters, connection summaries, and the Trinity focus. Neither invokes the Rust application.

| Mode | DIPL evaluation | Requirements to view |
|---|---|---|
| **Python, local default** | Native SNT CLI, once when the server starts; result held in memory | Python 3 and native `snt` on `PATH`, plus a browser |
| **Web, static / GitHub Pages** | SNT WebAssembly in a browser worker, on each page load | Browser only; no Python server or native SNT installation |

## Python mode: faster local use

After downloading or cloning this repository, run from its root:

```sh
python3 tools/ontology_graph.py
# Equivalent explicit command:
python3 tools/ontology_graph.py --mode python
```

Wait for the terminal to print the URL, then open [http://127.0.0.1:8765](http://127.0.0.1:8765). Use `--port 8878` to choose another port, and Ctrl-C to stop.

This mode uses Python's standard library and the existing native `adimaginem.load_ontology(include_viewer=True)` loader. No Python packages, compiled web artifacts, Emscripten, or sibling SNT source checkout are required. A compatible native `snt` command must already be installed; see [dependencies](../docs/dependencies.md). The server evaluates and inspects DIPL before opening the port, prints its startup time, and serves the result through `/api/ontology`. The response is an in-memory transport representation, not a separately maintained parameter file. Refreshes and additional browser tabs reuse it without starting WebAssembly or rerunning SNT. **Restart the server after changing DIPL.**

The server supplies the shared HTML with an explicit local data endpoint. Without that endpoint, the same frontend loads WebAssembly. Native load errors are reported directly; they do not silently trigger the slower web mode. Frontend JavaScript edits need a browser refresh; HTML edits need a server restart. Both modes still load visualization libraries and icons from CDNs, so neither is fully offline.

## Web mode: static build and GitHub Pages

The build needs `snt` on `PATH` with `dip package` support and an SNT checkout with its web artifacts already built. By default this is `../scinumtools3`; pass `--snt-root /path/to/snt3` to use another checkout. Build that checkout's web integration using its instructions in `docs/source/integrations/web.rst` (Emscripten, CMake, Ninja, Python 3.10+; use `-DCMAKE_BUILD_TYPE=Release`). Keep the native CLI and web runtime from the same SNT revision.

```sh
python3 tools/build_ontology_graph.py
python3 tools/ontology_graph.py --mode web --no-build
# Or build and serve in one command:
python3 tools/ontology_graph.py --mode web
```

Publish the **contents** of `build/ontology-graph/` as the Pages artifact, including `snt-web/`, `ontology.bundle.json`, and `.nojekyll`. All local asset URLs are relative, so a repository subdirectory such as `/adimaginem/` works. Use HTTP locally; module workers cannot be loaded reliably through `file://`. The preview server serves `.wasm` as `application/wasm`.

`snt dip package` bundles original DIPL source files in SNT's JSON transport envelope. It does not replace DIPL with an authored JSON ontology or a precomputed graph snapshot. The worker evaluates the bundle with SNT, then adapts evaluated scalar values, source rationales, color category metadata, and viewer settings to the existing graph data contract. Web mode makes no `/api/ontology` request. Rebuild after changing DIPL or viewer files; the static preview serves the built folder. `--output`, `--snt-root`, and `--no-build` are web-mode options.

The adapter is checked against the full Python loader's data, including concepts, edges, predicates, sources, passion profiles, rationales, and display settings. Run the full comparison after changes:

```sh
python3 tools/verify_web_parity.py
node --test tools/web_ontology_adapter.test.mjs tools/relationship_summary.test.mjs
node --test tools/ontology_loader.test.mjs tools/selection_force.test.mjs
```

The adapter supports scalar fields and one-dimensional string arrays, including tour tags, scene references, and highlighted subsets. It rejects unsupported array shapes, unitful values, unsafe integers, and truncated values explicitly. Such schema extensions require adapting the viewer contract. SNT's richer schema and inspection APIs remain available for future interfaces.

**Startup limitation:** evaluation and extraction of 8,006 paths took about 82 seconds in a local Node/WebAssembly parity check. The worker keeps the page responsive and reports progress, but each page load currently repeats extraction. This is data and interaction parity, not a claim of equal startup speed. A bulk value/metadata inspection API in SNT would help avoid thousands of individual description calls. The runtime WASM is approximately 4.8 MB before transfer compression. CDN dependencies below still require internet access.

## Exploring the graph

The left sidebar has three accordions: **Guided tours**, **Explore**, and **Concept connections**. Opening one closes the others; Explore opens initially. Guided tours offers 22 introductions with 79 cited scenes, including interfaith routes, sin and reconciliation, Purgatory, Mariology, and invocation of saints. Filter the catalogue by audience and topic. **Start tour** opens scenes with DIPL coordinates; **Previous**, **Next**, and **Exit tour** navigate them. Exiting restores the exploration view and sidebar state. Tours work in both running modes. See [guided tours](../docs/guided-tours.md) for source practice and authoring.

Use the concept search and domain/relation filters to focus the graph. Choose two concepts and select **Connect and explain** to trace their shortest connection under the active filters. Path search treats edges as traversable in either direction by default; enable **Follow arrow direction** to require subject-to-object traversal.

Use **Clear relation filter** below the relation list to deselect every relation type and show all types again, within the other active filters.

Each relation has an arrowhead at its midpoint, pointing from subject to object. Hover a relation to read its subject, predicate, and object. Direction follows the recorded predicate: for example, `is_effect_of` points from effect to cause. Arrows therefore express relation direction, which is not always causal influence. Multiple relations between the same concepts use separate curved paths, including relations in opposite directions. Selecting a concept brightens its incoming and outgoing arrows and thickens their lines for easier hovering; reset the view to clear that selection. The DIPL `highlighted_relation_width` controls this width and the width of a highlighted path.

The graph has separate **Concept colors** and **Relation colors** legend panels. Each can be collapsed independently; concept-group highlighting stays available in its own panel. Both panels scroll when space is limited.

Enable **Focus: Holy Trinity** to show the `God & Trinity` group and its internal connections. This uses the same DIPL color-category metadata as the legend, with the topic selected by `study_focus_concept`. Its introductory note and citation come from that concept. Other filters still apply; turn focus off or reset the graph to restore the wider ontology. See the [Trinity source guide](../docs/trinity.md) for the distinction between personal names, persons, essence, and relations of origin.

### Relationship explanations

Select two concepts and click **Connect and explain**. The independent **Connection summary** bubble opens on the left of the graph in a wider reading panel; the color legends stay on the right. On narrow screens, the summary sits above the legends without overlapping them. It can be collapsed without clearing the highlighted path, and scrolls independently. Its **Path explanation** combines DIPL concept labels, relation `prose_template` sentences, and the edges' `?rationale` metadata. Recipient scope, conditions, and draft/contested or interpretive status remain visible. Numbered source links open the expandable cited steps, which include relation definitions, causal qualifiers, passage citations, and the supporting citations for conditions.

**Disconnect concepts** clears the highlighted path and its summary, retaining the chosen endpoints for reuse and any independently selected concept or legend group. It is enabled after a connection search, including a search with no path.

Small text badges are informational classifications and qualifications, not buttons. `draft` is the DIPL `review_status` of our model encoding, awaiting scholarly review; it does not describe the authority of the cited text. `reviewed` and `contested` require an explicit review decision.

The **Influence overview** also gathers relevant capacities, effects, and explicit limits in each direction, even when recipient-scoped statements do not form a complete graph path to the person node. For example, fallen angel → human person includes demonic suggestion, temptation, effects on human powers, inability to compel consent, and the fact that not every sin requires a demonic suggestion. Its prose reuses DIPL rationales verbatim, retaining conditions and review status; expandable records expose exact predicates and citations.

One additional editorial field, `explanation_role` on existing relation definitions, classifies context, capacity, effect, or limit. The viewer explores capacities and effects through acts/offices, allowing a cited act-to-act classification step. It does not transfer agency through a shared class or creator. An exact `recipient_scope` match can identify a recipient class; this adds no graph edge and makes no assertion about every member. Limits are collected separately. `influence_summary_depth` in DIPL bounds exploration (default three steps). All statements respect current filters. This is a bounded selection of supporting records, not a complete causal inference engine; missing results mean no matching recorded evidence was found.

The path explanation describes the selected path under the current filters. It does not infer an additional causal connection, reverse a claim when traversing an edge backward, or assume this shortest route is the most philosophically informative one. A missing template falls back to the relation label. Changing endpoints or filters clears the old explanation; changing direction recomputes it. Reheating preserves it.

Templates are optional strings on existing relation records in `dip/relations.dip`, using only `{subject}` and `{object}`. They provide editorial sentence structure, not new evidence. The DIPL schema and Rust input type accept their absence; Rust validation checks supplied placeholders. `relationship_summary.mjs` assembles the statements without network services or generated claims. Check its direction, qualification, and fallback behavior with `node --test tools/relationship_summary.test.mjs`.

### Layout and appearance

The top header groups **Icon size**, **Reheat layout**, **Restore starting layout**, and **Reset graph view**, with the layout status underneath. Controls wrap on smaller screens.

God alone uses an original **Divine majesty** emblem: a beveled gold triangular aureole, rays, and a faceted ivory center with soft radiance. It is symbolic artwork, not a depiction of God's substance or a division into parts. Its size, gold and ivory colors, emission, and glow opacity are DIPL viewer parameters prefixed `god_icon_`. Collision spacing, link clearance, selection ring, and labels account for its larger size. The decorative glow does not intercept pointer events; the emblem retains its gold palette when a group is highlighted and dims with other unhighlighted concepts.

Annealing reserves space for arrowheads as well as icons, with longer preferred links and stronger repulsion. Arrow size scales with the icon size control. Arrow placement, opacity, line widths, curve spacing, link spacing, and repulsion are configured in `dip/graph_viewer.dip`. **Reheat layout** preserves a highlighted path and fits the settled graph to the view. Dense connections can still overlap in projection; rotating, zooming, and filtering help expose them.

Colorful concept icons are used as the graph nodes instead of plain dots. Labels are hidden by default to reduce clutter. Hover an icon to see its name and ID; selecting a concept or finding a path reveals labels for the highlighted nodes. Enable **Show all concept labels** to display every name.

Click the selected concept icon again, or use **×** in the top-right corner of its details panel, to deselect it. This clears the selection ring, selection emphasis, and search field while preserving any highlighted path and legend groups. The close button stays available when the panel scrolls.

Selecting a concept also gently pushes nearby concepts outward. A temporary local spring force expands the surrounding layout while keeping the selected concept and distant nodes anchored. Deselecting smoothly returns the nodes to their saved positions; switching directly between concepts reuses the original layout, so repeated selections do not accumulate drift. Reheating, restoring the starting layout, changing filters, or resizing icons clears that temporary expansion and runs normal annealing; if the selected concept is still visible, its local space reopens after settling. The DIPL parameters `selection_repulsion_enabled`, `selection_repulsion_radius`, `selection_repulsion_strength`, and `selection_return_strength` control this behavior. The radius scales with the selected icon, including God's larger emblem. Check the force and its reversible behavior with `node --test tools/selection_force.test.mjs`.

The selected concept has a glowing mint ring with rotating bright segments. It faces the viewer, follows the icon during annealing, and scales with icon size. Resetting the view clears it; filtering out the selected concept hides it. The ring does not enlarge the icon's pointer target. Its appearance and rotation speed are DIPL parameters; the browser's reduced-motion preference keeps the ring static.

Concept labels scale proportionally with the icons and sit below the ring's glow. When zoomed out, their text keeps a minimum screen size of 14 CSS pixels and draws over graph geometry for readability. Their width fits the text without compressing longer names. `label_height`, `label_min_text_pixels`, and `label_gap` in DIPL control sizing and spacing; labels do not expand the icons' pointer targets.

The **Color legend** distinguishes thirteen visual groups: person/soul/body, faculties and cognition, appetites and passions, metaphysical principles, God and Trinity, grace, virtues and habits, gifts, fruits, sacraments, created orders and creatures, sin/wounds/temptation, and angels/orders/ministry. Click one or more legend groups to brighten those icons and their incident relations while fading the rest. Click a group again, choose **Clear group highlights**, or reset the graph to release the focus. This emphasis leaves the graph positions intact. Legend counts follow the domain filters; expand **Relation colors** for the separate edge key. Selected concepts and path nodes remain emphasized while a group is focused.

Each concept's display entry in `dip/graph_colors.dip` applies one shared schema from `dip/schemas/graph_color_groups.dipl`. Each schema defines a single color whose `?category` metadata supplies the legend name. The viewer reads this metadata through SNT's inspection API. These are editorial display groups, separate from the philosophical categories in the ontology. Focus brightness and opacity are configured in `dip/graph_viewer.dip`.

The graph includes sourced relations for embodied cognition, practical reasoning and choice, virtue and faculty, and Trinitarian relations of origin, alongside the broader ontology. The 3D layout uses a cooled force simulation: connected concepts attract one another, while all visible concepts repel and avoid overlap. Relation kinds have different preferred distances. The **Icon size** control changes the 3D model scale and collision radius together. A narrowly expanded copy of each icon outline makes hover and selection easier while keeping the pointer target close to the visible shape. The default size, slider bounds, step, spacing, and pointer margin are DIPL parameters in `dip/graph_viewer.dip`. Select **Reheat layout** to restart attraction and repulsion from the current positions; select **Restore starting layout** to return to the seeded arrangement. After changing filters, reheat to settle using the currently visible relations. This is a visual layout heuristic, so it may settle into different local arrangements rather than encode a definitive philosophical distance.

Local Python mode, the static build, and the native parity check need the `snt` command on `PATH`; visitors to the static site do not. Three.js, 3d-force-graph, d3-force-3d, and Font Awesome Free Solid are loaded from CDNs, so the browser needs internet access to render and arrange the 3D graph. Each node is an individual Font Awesome vector icon, extruded into a shallow 3D mesh and faced toward the camera. There are no node badges or background circles. Icons use their display group's color; labels appear on hover and for selected or path concepts. Icon implementation details are kept out of the concept panel.

Icon attribution: **Font Awesome Free**, by Fonticons, Inc., licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Source: [Font Awesome Free](https://fontawesome.com/). The viewer uses modified, extruded vector forms from the solid icon set. Use `--host` and `--port` to change the local server address or port.

## Metaphysical foundations

The cited [metaphysics module](../docs/metaphysics.md) connects general principles to human nature, faculties, habits, and creation. Concept details include a **Principle** button for predicates with a DIPL `principle_id`. A principle's own panel lists the relations using it. These navigation references do not add synthetic graph edges or causal claims.

## Overlapping study areas

Expand **Study areas** in the left sidebar to filter by ethics, knowledge and truth, natural philosophy, logic, social and political philosophy, or the three broad areas. Checkboxes combine by union; domain and other filters still apply. **Clear study-area filter** restores all areas. **About selected areas** shows the cited scope and qualifications from DIPL, and concept panels list their memberships. See [study areas](../docs/study-areas.md).

## Force layout settings

Attraction weights, relation-kind grouping, preferred distances, collision, cooling, and initial spread are configured in [`dip/graph_viewer.dip`](../dip/graph_viewer.dip). See [graph layout controls](../docs/graph-layout.md) for the parameter table and formulas. These are visual tuning settings; they do not measure philosophical or causal strength. Restart Python mode or rebuild static mode after editing them.
