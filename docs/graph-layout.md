# Graph layout controls

Edit [`dip/graph_viewer.dip`](../dip/graph_viewer.dip), under `graph_viewer[default]`, to tune the graph. The [viewer schema](../dip/schemas/graph_viewer_parameters.dipl) documents the controls and validates the new numerical ranges with `!condition`.

These values govern **visual layout**. They do not express causal efficacy, doctrinal importance, confidence, or philosophical distance. Every visible link attracts its endpoints according to its layout class, including links that express opposition or exclusion.

## Attraction and preferred distance

| Links | Attraction parameter | Default | Distance parameter | Default |
| --- | --- | ---: | --- | ---: |
| `is_kind_of` | `link_strength_kind_of` | 0.5 | `link_distance_kind_of` | 2.7 |
| Kinds listed in `structural_link_kinds`, except `is_kind_of` | `link_strength_structural` | 0.3 | `link_distance_structural` | 3.2 |
| All other links | `link_strength_default` | 0.2 | `link_distance_default` | 4.1 |

`structural_link_kinds` initially contains `identity`, `classification`, and `composition`. It is an editable string array; the viewer checks its entries against the relation-color kind registry. The specific `is_kind_of` rule takes precedence.

For example, raising `link_strength_default` gives influence links more attraction, together with all other links in that class. Lowering `link_strength_kind_of` reduces the clustering caused by taxonomic links. These changes do not guarantee a particular global arrangement.

## Collision, repulsion, and settling

| Parameter | Meaning | Default |
| --- | --- | ---: |
| `link_spacing` | Multiplier on final preferred link distance | 1.6 |
| `link_arrow_clearance_ratio` | Total link clearance in multiples of arrow length | 2.0 |
| `charge_strength` | Global repulsion at the default icon size | -8.0 |
| `charge_icon_scale_exponent` | How repulsion scales with icon size | 2.0 |
| `collision_icon_radius_ratio` | Collision radius relative to scaled icon diameter | 0.52 |
| `collision_arrow_clearance_ratio` | Additional collision radius in arrow lengths | 0.5 |
| `collision_strength` | Collision correction strength | 0.72 |
| `collision_iterations` | Collision iterations per tick | 2 |
| `alpha_decay` | Cooling per tick; lower values allow more settling | 0.045 |
| `alpha_min` | Minimum simulation activity before stopping | 0.002 |
| `velocity_decay` | Fraction of velocity removed per tick | 0.65 |
| `cooldown_ms` | Maximum settling time per run in milliseconds | 9000 |
| `initial_radius` | Radius of the initial spherical placement | 5.0 |
| `initial_jitter` | Width of deterministic position perturbation | 0.2 |
| `tour_depth_ratio` | Initial tour depth perturbation in multiples of icon size, before recentering | 3.0 |

The existing `icon_gap`, icon-size controls, arrow-size control, and `selection_repulsion_*` settings remain in the same DIPL record. Initial placement uses the explicit DIPL order described below and a deterministic spherical distribution; making its spread configurable does not change that algorithm.

Guided tours start from their authored DIPL coordinates with deterministic depth offsets scaled by `tour_depth_ratio`. The offsets are centered to preserve the scene's initial mean depth. Nodes then relax freely using the shared attraction, repulsion, collision, and cooling settings above. Restore restarts the active scene; exiting a tour restores the saved exploration layout.

## What remains calculated

Code combines the DIPL settings with the current graph geometry. With icon slider value `I`, individual icon scale `S`, icon gap `G`, and rendered arrow length `A`:

```text
preferred link distance = link_spacing × max(
    distance for the link's layout class,
    I × (S_source + S_target) / 2 + 2 × G + link_arrow_clearance_ratio × A
)

collision radius = I × S × collision_icon_radius_ratio
                 + G + collision_arrow_clearance_ratio × A

repulsion = charge_strength × (I / default_icon_size)^charge_icon_scale_exponent
```

The half-sum uses the two endpoint radii; `2 × G` reserves one gap per endpoint. Mathematical constants in the spherical-placement formula, hash constants for deterministic jitter, and the force solver's algorithms remain code. They are not separately authored tuning values. D3 handles link-degree bias and integration internally; changing a displayed attraction parameter does not change a philosophical claim.

## Apply changes

- **Local Python mode:** restart `python3 tools/ontology_graph.py --port 8878`, then refresh the page. DIPL changes invalidate the persistent DIPH5 cache at server startup.
- **Static web mode:** rebuild with `./setup.sh --build` and serve or publish the rebuilt artifact.

Both modes use the same viewer code and DIPL settings. See [viewer instructions](../tools/README.md).

## Introductory rotation

After the initial graph settles and the camera fits it, the view begins a slow orbit. Moving the pointer, touching, clicking, scrolling, focusing a control, or using the keyboard stops it for the rest of that page load, including interactions during loading. Reheat, Reset, and tours do not restart it. Hidden tabs pause the orbit, and reduced-motion preferences disable it. Icons continue facing the viewer.

DIPL controls in `graph_viewer[default]` are `intro_rotation_enabled` (true), `intro_rotation_speed` (currently 8 in the viewer record, approximately a 7.5-second orbit at 60 fps; schema fallback 0.8), and `intro_rotation_delay_ms` (500 ms after camera fitting). These are presentation choices, with no ontological meaning.

## Stable concept and connection order

The original DIPL exporter and the persisted DIPH5 reader can return map entries in different orders. The graph previously used that incidental order to assign initial positions and process forces, so a cache change could alter its arrangement.

Two ordered DIPL lists now make this choice explicit:

- [`graph_layout_concepts.dip`](../dip/graph_layout_concepts.dip): `graph_layout.concept_order` determines which concept receives each starting position and the order of simulation nodes.
- [`graph_layout_edges.dip`](../dip/graph_layout_edges.dip): `graph_layout.edge_order` determines the order of simulation connections.

Each list entry applies the `graph_layout_entry` schema and contains an existing `id` and an explicit integer `position`. Positions preserve the original uncached declaration order. The viewer sorts by these positions: alphabetical map keys and lexicographically exported list indices no longer change initialization. Both Python and static viewers use these lists, including **Restore starting layout**.

When adding a concept or connection, append its ID with the next unused position to the appropriate list. Remove its entry if the record is deleted. The validator rejects missing, repeated, and unknown IDs, as well as invalid or repeated positions. Changing positions is an intentional visual change; it makes no claim of philosophical priority.

This stabilizes ordering, not every final coordinate. Adding concepts changes the initial distribution, and topology, filters, icon size, cooling time, library versions, and browser performance can still affect relaxation. The order does not prescribe a cone, cylinder, or sphere as the final shape. Guided tours retain their own authored coordinates and scene order.
