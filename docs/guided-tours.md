# Guided tours

Open **Guided tours** at the top of the graph's left sidebar. The catalogue has descriptions, topic tags, and an audience filter. All tours are available to everyone; audience tags describe invitations to dialogue, not an assessment of a visitor's beliefs.

| Tour | Intended dialogue | Scenes |
|---|---|---|
| One God, three persons | Muslims; general introduction | Divine unity; persons and essence; eternal Word; personal Love |
| The Son, eternity, and divine life | Jehovah's Witnesses; Christian dialogue | The Son's divinity; eternal generation; the Holy Spirit; common divine operation |
| Creation, change, and dependence | Atheists and agnostics; philosophical inquiry | Natural becoming; received being; creation; dependence and temporal beginning |

Select **Start tour**, then **Previous** or **Next**. Each scene shows its question, explanation, qualification, and source links. Concepts remain clickable, and the camera can rotate and zoom. Positions stay fixed so that annealing and selection repulsion do not rearrange the scene. Labels remain visible.

**Exit tour** or **Finish tour** restores the exploration view, including filters, icon size, selection, connection search, camera, and the saved layout. Ordinary layout controls are disabled while a tour is active.

## Sources and interpretation

Tour prose is authored in DIPL. It is an editorial explanation of the cited passages, not generated text or a new ontology relation. Every displayed line references an existing sourced edge. Concept placement is a reading aid: spatial separation does not imply parts in God, and proximity is not a measure of causal strength.

The Trinity scenes use Aquinas's *Summa theologiae* I, questions [27](https://www.newadvent.org/summa/1027.htm), [34](https://www.newadvent.org/summa/1034.htm), [37](https://www.newadvent.org/summa/1037.htm), and [42](https://www.newadvent.org/summa/1042.htm), together with the [Catechism's account of the Trinity](https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_one/article_1/paragraph_2_the_father.html). They distinguish one divine essence from personal distinction, and eternal origin from temporal beginning.

The creation tour distinguishes creation from natural change and from the question of a first moment. See *Summa theologiae* [I, q. 45](https://www.newadvent.org/summa/1045.htm), [I, q. 46, a. 2](https://www.newadvent.org/summa/1046.htm#article2), and [Catechism 301](https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_one/article_1/paragraph_4_the_creator.index.html). The scenes illustrate claims and arguments; the diagrams do not prove them.

The initial tours have `review_status = "draft"`, meaning that our editorial encoding awaits scholarly review. This does not qualify the authority of the underlying texts. See the project's [scholarly and Catholic method](method.md).

## Authoring in DIPL

The canonical files are in [`dip/tours/`](../dip/tours/). Three map schemas separate reusable catalogue information from individual scenes and coordinates:

| Map | Contents |
|---|---|
| `graph_tours` | Title, description, audience and topic tags, ordered step IDs, framing note, review status |
| `graph_tour_steps` | Tour ID, title, question, narrative, qualification, source/concept/edge IDs, focus concept, camera and look-at coordinates |
| `graph_tour_positions` | Step ID, concept ID, and explicit `x`, `y`, `z` coordinates |

These are presentation maps outside `ontology`. Sources remain in `ontology.sources`. No additional philosophical relation is inferred from tour membership or geometry.

For example, an existing position is declared as:

```dipl
graph_tour_positions[creation_duration_god]
  step_id = "creation_duration"
  concept_id = "god"
  x = -8.0
  y = 3.0
  z = 0.0
```

To add a tour:

1. Add a catalogue record in `catalogue.dip`, applying the existing map schema. Use stable IDs and an ordered `step_ids` list.
2. Add scene records in a new `.dip` file and import it in `dip/DIPfile`. Cite authoritative passages in each scene's `source_ids`; add source records only when needed.
3. Select existing concepts and edges. Both endpoints of every selected edge must appear in the scene. Preserve the edge's original direction and qualifications.
4. Give every selected concept one position for that scene. Set a camera position and look-at target; the default camera is `(0, 0, 32)` looking at the origin.
5. Write a concise question, explanation, and qualification. Avoid attributing a belief to every member of an audience, and identify distinctions that the diagram could otherwise obscure.

The shared viewer validator rejects missing citations, unknown or out-of-scene edges, repeated or orphan steps, missing/duplicate positions, nonfinite coordinates, and invalid camera targets. `tour_icon_size` and `tour_transition_ms` are configured in `dip/graph_viewer.dip`; reduced-motion preferences disable camera animation.

## Running and checking

Tours use the same implementation in [local Python and static WebAssembly modes](../tools/README.md). Restart the Python server after DIPL edits. Rebuild the static bundle after DIPL or frontend edits; the bundle includes all tour files and the shared validator.

```sh
node --test tools/guided_tours.test.mjs
python3 tools/build_ontology_graph.py
python3 tools/verify_web_parity.py
```

The unit checks cover scene consistency. The parity check compares the full native and browser data, including catalogue entries, narratives, citations, and coordinates. Neither check replaces theological review.
