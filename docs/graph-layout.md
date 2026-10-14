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

The existing `icon_gap`, icon-size controls, arrow-size control, and `selection_repulsion_*` settings remain in the same DIPL record. Initial placement still uses record order and a deterministic spherical distribution; making its spread configurable does not change that algorithm.

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

- **Local Python mode:** restart `python3 tools/ontology_graph.py --port 8878`, then refresh the page. DIPL is cached at server startup.
- **Static web mode:** rebuild with `python3 tools/build_ontology_graph.py` and serve or publish the rebuilt artifact.

Both modes use the same viewer code and DIPL settings. See [viewer instructions](../tools/README.md).
