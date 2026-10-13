# Ad Imaginem ontology graph explorer

This standalone Python tool evaluates the project's DIPL graph with the SNT CLI and serves an interactive 3D visualization. It does not invoke the Rust application. Node icons are chosen from concept IDs and categories; selecting a concept displays its Latin name, definition, source, and directly connected cited relations.

Run from the project root:

```sh
python3 tools/ontology_graph.py
```

Open [http://127.0.0.1:8765](http://127.0.0.1:8765). Use the concept search and domain/relation filters to focus the graph. Choose two concepts and select **Highlight shortest path** to trace their shortest connection under the active filters. Path search treats edges as traversable in either direction by default; enable **Follow arrow direction** to require subject-to-object traversal.

Use **Clear relation filter** below the relation list to deselect every relation type and show all types again, within the other active filters.

Each relation has an arrowhead at its midpoint, pointing from subject to object. Hover a relation to read its subject, predicate, and object. Direction follows the recorded predicate: for example, `is_effect_of` points from effect to cause. Arrows therefore express relation direction, which is not always causal influence. Multiple relations between the same concepts use separate curved paths, including relations in opposite directions. Selecting a concept brightens its incoming and outgoing arrows and thickens their lines for easier hovering; reset the view to clear that selection. The DIPL `highlighted_relation_width` controls this width and the width of a highlighted path.

The graph has separate **Concept colors** and **Relation colors** legend panels. Each can be collapsed independently; concept-group highlighting stays available in its own panel. Both panels scroll when space is limited.

### Relationship explanations

Select two concepts and click **Connect and explain**. The independent **Connection summary** bubble opens on the left of the graph in a wider reading panel; the color legends stay on the right. On narrow screens, the summary sits above the legends without overlapping them. It can be collapsed without clearing the highlighted path, and scrolls independently. Its **Path explanation** combines DIPL concept labels, relation `prose_template` sentences, and the edges' `?rationale` metadata. Recipient scope, conditions, and draft/contested or interpretive status remain visible. Numbered source links open the expandable cited steps, which include relation definitions, causal qualifiers, passage citations, and the supporting citations for conditions.

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

The selected concept has a glowing mint ring with rotating bright segments. It faces the viewer, follows the icon during annealing, and scales with icon size. Resetting the view clears it; filtering out the selected concept hides it. The ring does not enlarge the icon's pointer target. Its appearance and rotation speed are DIPL parameters; the browser's reduced-motion preference keeps the ring static.

Concept labels scale proportionally with the icons and sit below the ring's glow. When zoomed out, their text keeps a minimum screen size of 14 CSS pixels and draws over graph geometry for readability. Their width fits the text without compressing longer names. `label_height`, `label_min_text_pixels`, and `label_gap` in DIPL control sizing and spacing; labels do not expand the icons' pointer targets.

The **Color legend** distinguishes thirteen visual groups: person/soul/body, faculties and cognition, appetites and passions, metaphysical principles, God and Trinity, grace, virtues and habits, gifts, fruits, sacraments, created orders and creatures, sin/wounds/temptation, and angels/orders/ministry. Click one or more legend groups to brighten those icons and their incident relations while fading the rest. Click a group again, choose **Clear group highlights**, or reset the graph to release the focus. This emphasis leaves the graph positions intact. Legend counts follow the domain filters; expand **Relation colors** for the separate edge key. Selected concepts and path nodes remain emphasized while a group is focused.

Each concept's display entry in `dip/graph_colors.dip` applies one shared schema from `dip/schemas/graph_color_groups.dipl`. Each schema defines a single color whose `?category` metadata supplies the legend name. The viewer reads this metadata through SNT's inspection API. These are editorial display groups, separate from the philosophical categories in the ontology. Focus brightness and opacity are configured in `dip/graph_viewer.dip`.

The graph includes sourced relations for embodied cognition, practical reasoning and choice, virtue and faculty, and Trinitarian relations of origin, alongside the broader ontology. The 3D layout uses a cooled force simulation: connected concepts attract one another, while all visible concepts repel and avoid overlap. Relation kinds have different preferred distances. The **Icon size** control changes the 3D model scale and collision radius together. A narrowly expanded copy of each icon outline makes hover and selection easier while keeping the pointer target close to the visible shape. The default size, slider bounds, step, spacing, and pointer margin are DIPL parameters in `dip/graph_viewer.dip`. Select **Reheat layout** to restart attraction and repulsion from the current positions; select **Restore starting layout** to return to the seeded arrangement. After changing filters, reheat to settle using the currently visible relations. This is a visual layout heuristic, so it may settle into different local arrangements rather than encode a definitive philosophical distance.

The viewer needs the `snt` command available on `PATH` to evaluate `dip/DIPfile`. Three.js, 3d-force-graph, and Font Awesome Free Solid are loaded from CDNs, so the browser needs internet access to render and arrange the 3D graph. Each node is an individual Font Awesome vector icon, extruded into a shallow 3D mesh and faced toward the camera. There are no node badges or background circles. Icons use their display group's color; labels appear on hover and for selected or path concepts.

Icon attribution: **Font Awesome Free**, by Fonticons, Inc., licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Source: [Font Awesome Free](https://fontawesome.com/). The viewer uses modified, extruded vector forms from the solid icon set. Use `--host` and `--port` to change the local server address or port.
