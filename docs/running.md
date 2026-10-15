# Running and publishing

## Choose how you want to use it

- **Read and explore online:** open the published website and choose **Explore the graph**. No installation is needed.
- **Preview the whole site locally:** from your downloaded repository, run `./setup.sh --web`, then open the address printed in the terminal.
- **Run just the graph locally:** use `./setup.sh --python`. This starts the same explorer without the website's landing page and documentation navigation.

Local modes need the [listed dependencies](dependencies.md). If you are only visiting the published website, you can go straight to [Exploring the graph](#exploring-the-graph).

## Setup commands

Run `setup.sh` from the checkout (it also works when invoked from another directory):

| Command | Action |
| --- | --- |
| `./setup.sh -w` or `--web` | Export current DIPL and start the Astro development server |
| `./setup.sh -p` or `--python` | Start the standalone Python graph viewer |
| `./setup.sh -d` or `--diph5` | Force evaluation and rebuild the persisted DIPH5 snapshot |
| `./setup.sh -b` or `--build` | Build the static website into `dist/` |
| `./setup.sh -s` or `--preview` | Serve an existing static build |
| `./setup.sh -c` or `--check` | Build, test graph/cache behavior, and check static links |
| `./setup.sh -i` or `--install` | Install locked npm dependencies |
| `./setup.sh -h` or `--help` | Show usage |

Server options are forwarded: `./setup.sh --web --port 4321` or `./setup.sh --python --port 8878`. Use Ctrl-C to stop. See [dependencies](dependencies.md) for prerequisites.

Open the exact URL printed by the server, including any base path. If a port is occupied, startup fails rather than silently moving to another port; stop the other server or choose `--port 4322`. If Astro was started in the background, use `npm run dev -- stop` or `npm run preview -- stop` to stop that server.

## Astro website

`./setup.sh --web` installs npm dependencies if needed, evaluates or loads DIPL, validates the graph, and starts Astro. Open the URL printed in the terminal (normally `http://localhost:4321/`). The site has a landing page, `/graph/`, and `/docs/`.

The static graph fetches a generated ontology asset. DIPL evaluation happens during the build; visitors do not run SNT. All citations, rationale metadata, tours, and display controls are preserved. For a production preview, run `./setup.sh --build` followed by `./setup.sh --preview`.

Astro refreshes page and documentation edits during development. The graph assets are generated: after editing DIPL or files under `tools/`, restart `--web`, or run `npm run data` while Astro is running. Rebuild before publishing.

The `BASE_PATH` and `SITE_URL` environment variables configure hosting conventions. For a repository site, test with `BASE_PATH=/adimaginem/ ./setup.sh --build` and use the same `BASE_PATH` for preview. Graph assets and documentation links honor that subpath.

## Python mode: lightweight local use

```sh
./setup.sh --python
# Equivalent direct command:
python3 tools/ontology_graph.py --port 8765
```

Open the printed URL (normally `http://127.0.0.1:8765/`). This mode needs only Python's standard library, the native SNT CLI, and a browser. It serves the graph directly, without the Astro landing page or documentation shell. Browser refreshes reuse the in-memory ontology. Restart after DIPL or HTML edits; JavaScript edits need a refresh.

Both modes use the same graph HTML, JavaScript, and native data loader. Visualization libraries and icons still load from CDNs, so the graph is not fully offline.

## DIPH5 persistence

While a snapshot loads, the terminal shows a completed-stage counter (`0/3` through `3/3`): export, decoding/metadata recovery, and assembly of the graph data. SNT 0.9.5+ exports values and metadata together; 0.9.4 reads them separately. During long SNT reads, elapsed time updates every five seconds. These are completed stages, not a byte percentage or an estimate of time remaining. The same progress appears in both local modes and static exports.

Evaluated environments are cached at `build/diph5/<fingerprint>.diph5`. Values, citation rationales, and category metadata come from the same snapshot. Cache identity covers all files under `dip/`, including schemas, names, and contents, plus project location and SNT executable/version. Changes invalidate the snapshot. `./setup.sh --diph5` forces a fresh evaluation even if the inputs match.

Snapshots are published atomically after successful reads. Corrupt or unreadable snapshots trigger one rebuild. Input changes during loading produce a retry error. The cache assumes the project's inputs remain self-contained in `dip/`; external inputs or in-place SNT shared-library changes require extending cache identity or forcing a rebuild. Old snapshots can be removed from `build/diph5/` to reclaim space. Rebuilding DIPH5 does not refresh an already running Python server or regenerate a published site.

The generated browser JSON is transport data, never a second authored parameter set. DIPL remains canonical. Generated snapshots, assets, and site output are ignored by Git.

## GitHub Pages

The workflow in [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) runs on pushes to `main`, pull requests, and manual dispatch. It installs a pinned SNT Linux CLI with checksum verification, exports and validates the ontology, builds Astro, runs checks, and uploads `dist/`. The deployment job publishes only from `main`, never from a pull request.

In the GitHub repository, set **Settings → Pages → Build and deployment → Source → GitHub Actions**. Then push the changes to `main` or run the workflow manually. No deployment token or external hosting service is needed; the deploy job uses GitHub's Pages and OIDC permissions.

The workflow derives the base path from the repository name, including the root-path exception for `<owner>.github.io`. If using a custom domain, update the site/base configuration and configure that domain in Pages. This implementation follows [Astro's GitHub Pages deployment guidance](https://docs.astro.build/en/guides/deploy/github/).

## Exploring the graph

The left sidebar has three accordions: **Guided tours**, **Explore**, and **Concept connections**. Opening one closes the others; Explore opens initially. Guided tours offers 26 introductions with 91 cited scenes, including interfaith routes, sin and reconciliation, Purgatory, Mariology, and invocation of saints. Filter the catalogue by audience and topic. **Start tour** opens scenes seeded by DIPL coordinates and relaxed in three dimensions; **Previous**, **Next**, and **Exit tour** navigate them. Icon sizing, reheating, restoring the scene, and node dragging remain available during tours. Exiting restores the exploration view and sidebar state. Tours work in both running modes. See [guided tours](guided-tours.md) for source practice and authoring.

Use the concept search and domain/relation filters to focus the graph. Choose two concepts and select **Connect and explain** to trace their shortest connection under the active filters. Path search treats edges as traversable in either direction by default; enable **Follow arrow direction** to require subject-to-object traversal.

Use **Clear relation filter** below the relation list to deselect every relation type and show all types again, within the other active filters.

Each relation has an arrowhead at its midpoint, pointing from subject to object. Hover a relation to read its subject, predicate, and object. Direction follows the recorded predicate: for example, `is_effect_of` points from effect to cause. Arrows therefore express relation direction, which is not always causal influence. Multiple relations between the same concepts use separate curved paths, including relations in opposite directions. Selecting a concept brightens its incoming and outgoing arrows and thickens their lines for easier hovering; reset the view to clear that selection. The DIPL `highlighted_relation_width` controls this width and the width of a highlighted path.

The graph has separate **Concept colors** and **Relation colors** legend panels. Each can be collapsed independently; concept-group highlighting stays available in its own panel. Both panels scroll when space is limited.

Enable **Focus: Holy Trinity** to show the `God & Trinity` group and its internal connections. This uses the same DIPL color-category metadata as the legend, with the topic selected by `study_focus_concept`. Its introductory note and citation come from that concept. Other filters still apply; turn focus off or reset the graph to restore the wider ontology. See the [Trinity source guide](trinity.md) for the distinction between personal names, persons, essence, and relations of origin.

### Relationship explanations

Select two concepts and click **Connect and explain**. The independent **Connection summary** bubble opens on the left of the graph in a wider reading panel; the color legends stay on the right. On narrow screens, the summary sits above the legends without overlapping them. It can be collapsed without clearing the highlighted path, and scrolls independently. Its **Path explanation** combines DIPL concept labels, relation `prose_template` sentences, and the edges' `?rationale` metadata. Recipient scope, conditions, and draft/contested or interpretive status remain visible. Numbered source links open the expandable cited steps, which include relation definitions, causal qualifiers, passage citations, and the supporting citations for conditions.

**Disconnect concepts** clears the highlighted path and its summary, retaining the chosen endpoints for reuse and any independently selected concept or legend group. It is enabled after a connection search, including a search with no path.

Small text badges are informational classifications and qualifications, not buttons. `draft` is the DIPL `review_status` of our model encoding, awaiting scholarly review; it does not describe the authority of the cited text. `reviewed` and `contested` require an explicit review decision.

The **Influence overview** also gathers relevant capacities, effects, and explicit limits in each direction, even when recipient-scoped statements do not form a complete graph path to the person node. For example, fallen angel → human person includes demonic suggestion, temptation, effects on human powers, inability to compel consent, and the fact that not every sin requires a demonic suggestion. Its prose reuses DIPL rationales verbatim, retaining conditions and review status; expandable records expose exact predicates and citations.

One additional editorial field, `explanation_role` on existing relation definitions, classifies context, capacity, effect, or limit. The viewer explores capacities and effects through acts/offices, allowing a cited act-to-act classification step. It does not transfer agency through a shared class or creator. An exact `recipient_scope` match can identify a recipient class; this adds no graph edge and makes no assertion about every member. Limits are collected separately. Directions with no statements or limits are omitted; if both directions are empty, the entire Influence overview is hidden. `influence_summary_depth` in DIPL bounds exploration (default three steps). All statements respect current filters. This is a bounded selection of supporting records, not a complete causal inference engine; missing results mean no matching recorded evidence was found.

The path explanation describes the selected path under the current filters. It does not infer an additional causal connection, reverse a claim when traversing an edge backward, or assume this shortest route is the most philosophically informative one. A missing template falls back to the relation label. Changing endpoints or filters clears the old explanation; changing direction recomputes it. Reheating preserves it.

Templates are optional strings on existing relation records in `dip/relations.dip`, using only `{subject}` and `{object}`. They provide editorial sentence structure, not new evidence. The DIPL schema accepts their absence; the shared graph validator checks supplied placeholders. `relationship_summary.mjs` assembles the statements without network services or generated claims. Check its direction, qualification, and fallback behavior with `node --test tools/relationship_summary.test.mjs`.

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

Each concept's display entry in `dip/graph_colors.dip` applies one shared schema from `dip/schemas/graph_color_groups.dipl`. Each schema defines a single color whose `?category` metadata supplies the legend name. The loader reads this metadata through SNT's metadata export, or bulk inspection on older SNT. These are editorial display groups, separate from the philosophical categories in the ontology. Focus brightness and opacity are configured in `dip/graph_viewer.dip`.

The graph includes sourced relations for embodied cognition, practical reasoning and choice, virtue and faculty, and Trinitarian relations of origin, alongside the broader ontology. The 3D layout uses a cooled force simulation: connected concepts attract one another, while all visible concepts repel and avoid overlap. Relation kinds have different preferred distances. The **Icon size** control changes the 3D model scale and collision radius together. A narrowly expanded copy of each icon outline makes hover and selection easier while keeping the pointer target close to the visible shape. The default size, slider bounds, step, spacing, and pointer margin are DIPL parameters in `dip/graph_viewer.dip`. Select **Reheat layout** to restart attraction and repulsion from the current positions; select **Restore starting layout** to return to the seeded arrangement. After changing filters, reheat to settle using the currently visible relations. This is a visual layout heuristic, so it may settle into different local arrangements rather than encode a definitive philosophical distance.

Local Python mode, the static build, and the native parity check need the `snt` command on `PATH`; visitors to the static site do not. Three.js, 3d-force-graph, d3-force-3d, and Font Awesome Free Solid are loaded from CDNs, so the browser needs internet access to render and arrange the 3D graph. Each node is an individual Font Awesome vector icon, extruded into a shallow 3D mesh and faced toward the camera. There are no node badges or background circles. Icons use their display group's color; labels appear on hover and for selected or path concepts. Icon implementation details are kept out of the concept panel.

Icon attribution: **Font Awesome Free**, by Fonticons, Inc., licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Source: [Font Awesome Free](https://fontawesome.com/). The viewer uses modified, extruded vector forms from the solid icon set. Use `--host` and `--port` to change the local server address or port.

## Metaphysical foundations

The cited [metaphysics module](metaphysics.md) connects general principles to human nature, faculties, habits, and creation. Concept details include a **Principle** button for predicates with a DIPL `principle_id`. A principle's own panel lists the relations using it. These navigation references do not add synthetic graph edges or causal claims.

## Overlapping study areas

Expand **Study areas** in the left sidebar to filter by ethics, knowledge and truth, natural philosophy, logic, social and political philosophy, or the three broad areas. Checkboxes combine by union; domain and other filters still apply. **Clear study-area filter** restores all areas. **About selected areas** shows the cited scope and qualifications from DIPL, and concept panels list their memberships. See [study areas](study-areas.md).

## Force layout settings

Attraction weights, relation-kind grouping, preferred distances, collision, cooling, and initial spread are configured in [`dip/graph_viewer.dip`](../dip/graph_viewer.dip). See [graph layout controls](graph-layout.md) for the parameter table and formulas. These are visual tuning settings; they do not measure philosophical or causal strength. Restart Python mode or rebuild static mode after editing them.

### Grounding, sources, and concept accordions

**Explore → Grounding and historical sources** filters by mode of knowledge, historical witness family, and how the passage supports a claim. Combined filters must match the same evidence record. Relations are assessed separately from their endpoints; endpoints of matching relations remain as context. Clear grounding filters or Reset graph view removes these filters. Unassessed means not yet classified, not unsupported.

Concept details use separate accordions for Definition, Grounding and sources, Study areas, relation principles where applicable, and Connected relations. Each connected relation can expand to show its rationale, citations, conditions, and additional support records. The concept panel remembers the section being read. Connection summaries expose the same edge evidence. These controls work in both Python and static modes.

See [the assessment method and coverage](grounding-and-sources.md). Run `node --test tools/source_support.test.mjs` for evidence validation, combined filtering, and independent concept/relation assessments.
