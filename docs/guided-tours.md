# Guided tours

Open **Guided tours** at the top of the graph's left sidebar. The catalogue has descriptions, audience and topic filters, and 22 tours with 79 scenes. The filters combine: a tour must match both selections. All tours are available to everyone; audience tags describe invitations to dialogue, not an assessment of a visitor's beliefs.

| Tour | Intended dialogue | Scenes |
|---|---|---|
| One God, three persons | Muslims; general introduction | Divine unity; persons and essence; eternal Word; personal Love |
| The Son, eternity, and divine life | Jehovah's Witnesses; Christian dialogue | The Son's divinity; eternal generation; the Holy Spirit; common divine operation |
| Creation, change, and dependence | Atheists and agnostics; philosophical inquiry | Natural becoming; received being; creation; dependence and temporal beginning |
| Grace, faith, charity, and action | Dialogue with Protestant and Evangelical Christians; Christian dialogue | Grace initiates conversion; Faith and charity engage our powers; Love becomes action |
| The Spirit's work in a person | Dialogue with Pentecostal and charismatic Christians; Catholic formation | Gifts dispose us to divine guidance; Understanding and counsel; Fruits appear in living |
| Participation in divine life | Dialogue with Eastern Orthodox Christians; Christian dialogue | Grace and participation; Charity and spiritual judgment; Different expressions of procession |
| Divine unity and Christian language about God | Dialogue with Jewish visitors; Interfaith dialogue | One, simple God; Creator and creatures; What Christians mean by personal distinction |
| What Catholics mean by divine | Dialogue with Latter-day Saints; Interfaith dialogue | God and pure act; Spiritual beings are creatures; Sharing in divine life |
| God, world, and the human soul | Dialogue with Hindu visitors; Interfaith dialogue | Dependence on the creator; The embodied person; Love directed toward God |
| Desire, suffering, and human flourishing | Dialogue with Buddhist visitors; Philosophical inquiry | Love, desire, and delight; Passions and moral formation; Peace and ordered love |
| Spiritual life and human nature | Spiritual seekers; General introduction | One soul, several powers; Nature and grace; Feeling and spiritual judgment |
| The human person transformed by grace | Catechumens; Catholic formation; General introduction | Begin with the whole person; Grace and virtue; Life begins and is nourished |
| Body, soul, and powers | Psychology and neuroscience students; Philosophical inquiry | A living bodily unity; From imagination to understanding; Sensible appetite and will |
| From perceived good to responsible action | Philosophy students; Secular humanists; Philosophical inquiry | The good as apprehended; Deliberation and choice; Virtue and vice |
| Different kinds of explanation | Scientists and scientifically minded readers; Philosophy students | Four causal questions; Matter and form in explanation; Natural change and creation |
| Good, evil, and freedom | People exploring the problem of evil; Philosophical inquiry; General introduction | Evil and a missing due good; Moral guilt and consent; Wounded powers and conversion |
| Words that need careful distinctions | Catechists; Interfaith discussion leaders; Philosophy students | Substance and qualities; Person in Trinitarian language; Spiritual does not mean divine |
| Sacraments and the life of grace | Catechumens; Catholic formation; Dialogue with Protestant and Evangelical Christians; Christian dialogue | God acts through sacramental signs; Beginning, strengthening, nourishment; Forgiveness within sacramental life |
| Sin, the intellect, and reconciliation | Catholic formation; Catechumens; Philosophical inquiry | Where is sin in a person?; The intellect is wounded, not destroyed; How judgment becomes clouded; Mortal and venial sin; Grace moves the return; Confession and sacramental absolution; Forgiveness and continuing healing |
| Purgatory, forgiveness, and the hope of heaven | Dialogue with Protestant and Evangelical Christians; Christian dialogue; Catholic formation | Death and particular judgment; Heaven and Hell; Forgiven guilt and remaining consequences; Purification of the saved; Prayer for the departed; The hope includes the body |
| Mary, Mother of God, and the communion of saints | Dialogue with Protestant and Evangelical Christians; Christian dialogue; Dialogue with Eastern Orthodox Christians; Catholic formation | Theotokos: who was born of Mary?; The virgin mother; Redeemed by preservation; Body and soul in glory; Asking Mary and the saints to pray; Dulia, hyperdulia, and latria |
| Why ask Mary and the saints to pray? | Dialogue with Protestant and Evangelical Christians; Christian dialogue; Spiritual seekers; Catholic formation | Communion across death; Invocation asks for intercession; All intercession depends on Christ |

Select **Start tour**, then **Previous** or **Next**. Each scene shows its question, explanation, qualification, and source links. Concepts remain clickable, and the camera can rotate and zoom. Positions stay fixed so that annealing and selection repulsion do not rearrange the scene. Labels remain visible.

**Exit tour** or **Finish tour** restores the exploration view, including filters, icon size, selection, connection search, camera, and the saved layout. Ordinary layout controls are disabled while a tour is active.

## Sidebar organization

The left sidebar has three keyboard-accessible accordions: **Guided tours**, **Explore**, and **Concept connections**. Opening one closes the others. Explore opens initially. During a tour, the active scene remains inside Guided tours, and ordinary exploration controls are temporarily hidden. Exiting restores the prior accordion state as well as the graph.

## Sources and interpretation

Tour prose is authored in DIPL. It is an editorial explanation of the cited passages, not generated text or a new ontology relation. Every displayed line references an existing sourced edge. Concept placement is a reading aid: spatial separation does not imply parts in God, and proximity is not a measure of causal strength.

The Trinity scenes use Aquinas's *Summa theologiae* I, questions [27](https://www.newadvent.org/summa/1027.htm), [34](https://www.newadvent.org/summa/1034.htm), [37](https://www.newadvent.org/summa/1037.htm), and [42](https://www.newadvent.org/summa/1042.htm), together with the [Catechism's account of the Trinity](https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_one/article_1/paragraph_2_the_father.html). They distinguish one divine essence from personal distinction, and eternal origin from temporal beginning.

The creation tour distinguishes creation from natural change and from the question of a first moment. See *Summa theologiae* [I, q. 45](https://www.newadvent.org/summa/1045.htm), [I, q. 46, a. 2](https://www.newadvent.org/summa/1046.htm#article2), and [Catechism 301](https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_one/article_1/paragraph_4_the_creator.index.html). The scenes illustrate claims and arguments; the diagrams do not prove them.

The tours have `review_status = "draft"`, meaning that our editorial encoding awaits scholarly review. This does not qualify the authority of the underlying texts. See the project's [scholarly and Catholic method](method.md).

The dedicated [sin and reconciliation](sin-and-angels.md#sin-intellect-and-reconciliation-tour), [last things](eschatology.md), and [Mary and the saints](mariology.md) guides document the added ontology and its interpretive boundaries. All scenes use the same canonical concepts visible in ordinary exploration.

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
