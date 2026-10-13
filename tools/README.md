# Ad Imaginem ontology graph explorer

This standalone Python tool evaluates the project's DIPL graph with the SNT CLI and serves an interactive 3D visualization. It does not invoke the Rust application. Node icons are chosen from concept IDs and categories; selecting a concept displays its Latin name, definition, source, and directly connected cited relations.

Run from the project root:

```sh
python3 tools/ontology_graph.py
```

Open [http://127.0.0.1:8765](http://127.0.0.1:8765). Use the concept search and domain/relation filters to focus the graph. Choose two concepts and select **Highlight shortest path** to trace their shortest connection under the active filters. Path search treats edges as traversable in either direction by default; enable **Follow arrow direction** to require subject-to-object traversal.

Use **Clear relation filter** below the relation list to deselect every relation type and show all types again, within the other active filters.

Each relation has an arrowhead at its midpoint, pointing from subject to object. Hover a relation to read its subject, predicate, and object. Direction follows the recorded predicate: for example, `is_effect_of` points from effect to cause. Arrows therefore express relation direction, which is not always causal influence. Multiple relations between the same concepts use separate curved paths, including relations in opposite directions. Selecting a concept brightens its incoming and outgoing arrows; reset the view to clear that selection.

Annealing reserves space for arrowheads as well as icons, with longer preferred links and stronger repulsion. Arrow size scales with the icon size control. Arrow placement, opacity, line widths, curve spacing, link spacing, and repulsion are configured in `dip/graph_viewer.dip`. **Reheat layout** preserves a highlighted path and fits the settled graph to the view. Dense connections can still overlap in projection; rotating, zooming, and filtering help expose them.

Colorful concept icons are used as the graph nodes instead of plain dots. Labels are hidden by default to reduce clutter. Hover an icon to see its name and ID; selecting a concept or finding a path reveals labels for the highlighted nodes. Enable **Show all concept labels** to display every name.

The selected concept has a glowing mint ring with rotating bright segments. It faces the viewer, follows the icon during annealing, and scales with icon size. Resetting the view clears it; filtering out the selected concept hides it. The ring does not enlarge the icon's pointer target. Its appearance and rotation speed are DIPL parameters; the browser's reduced-motion preference keeps the ring static.

Concept labels scale proportionally with the icons and sit below the ring's glow. When zoomed out, their text keeps a minimum screen size of 14 CSS pixels and draws over graph geometry for readability. Their width fits the text without compressing longer names. `label_height`, `label_min_text_pixels`, and `label_gap` in DIPL control sizing and spacing; labels do not expand the icons' pointer targets.

The **Color legend** distinguishes thirteen visual groups: person/soul/body, faculties and cognition, appetites and passions, metaphysical principles, God and Trinity, grace, virtues and habits, gifts, fruits, sacraments, created orders and creatures, sin/wounds/temptation, and angels/orders/ministry. Click one or more legend groups to brighten those icons and their incident relations while fading the rest. Click a group again, choose **Clear group highlights**, or reset the graph to release the focus. This emphasis leaves the graph positions intact. Legend counts follow the domain filters; expand **Relation colors** for the separate edge key. Selected concepts and path nodes remain emphasized while a group is focused.

Each concept's display entry in `dip/graph_colors.dip` applies one shared schema from `dip/schemas/graph_color_groups.dipl`. Each schema defines a single color whose `?category` metadata supplies the legend name. The viewer reads this metadata through SNT's inspection API. These are editorial display groups, separate from the philosophical categories in the ontology. Focus brightness and opacity are configured in `dip/graph_viewer.dip`.

The graph includes sourced relations for embodied cognition, practical reasoning and choice, virtue and faculty, and Trinitarian relations of origin, alongside the broader ontology. The 3D layout uses a cooled force simulation: connected concepts attract one another, while all visible concepts repel and avoid overlap. Relation kinds have different preferred distances. The **Icon size** control changes the 3D model scale and collision radius together. A narrowly expanded copy of each icon outline makes hover and selection easier while keeping the pointer target close to the visible shape. The default size, slider bounds, step, spacing, and pointer margin are DIPL parameters in `dip/graph_viewer.dip`. Select **Reheat layout** to restart attraction and repulsion from the current positions; select **Restore starting layout** to return to the seeded arrangement. After changing filters, reheat to settle using the currently visible relations. This is a visual layout heuristic, so it may settle into different local arrangements rather than encode a definitive philosophical distance.

The viewer needs the `snt` command available on `PATH` to evaluate `dip/DIPfile`. Three.js, 3d-force-graph, and Font Awesome Free Solid are loaded from CDNs, so the browser needs internet access to render and arrange the 3D graph. Each node is an individual Font Awesome vector icon, extruded into a shallow 3D mesh and faced toward the camera. There are no node badges or background circles. Icons use their display group's color; labels appear on hover and for selected or path concepts.

Icon attribution: **Font Awesome Free**, by Fonticons, Inc., licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Source: [Font Awesome Free](https://fontawesome.com/). The viewer uses modified, extruded vector forms from the solid icon set. Use `--host` and `--port` to change the local server address or port.
