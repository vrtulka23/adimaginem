# Ontology data in DIPL

The [`dip/DIPfile`](../dip/DIPfile) is the SNT3 project entry point. It loads the [concepts](../dip/concepts.dip), [sources](../dip/sources.dip), and [edges](../dip/edges.dip), with reusable schemas in [`dip/schemas/`](../dip/schemas/). The ontology is a small, cited starting graph for the human model. It covers the embodied person, the rational soul and its powers, and the principles of matter, form, potency, actuality, privation, substance, accident, and the four causes. The graph is a scholarly representation of selected passages, not a claim that a DIPL node is a human being or a spiritual soul. Extend it passage by passage under the [scholarly method](method.md).

## Data contract

The `ontology` tree has three collections:

| Collection | Purpose |
| --- | --- |
| `concepts[id]` | Stable concept IDs with an English `label`, a `latin_name`, an editorial `domain` and `category`, a short note, and a `source_id`. The `ontological_concept` schema checks their shape and category values and gives options readable labels. |
| `sources[id]` | Passage-level provenance: author, work, precise locator, and edition URL. The `ontological_source` schema checks the record shape. IDs are stable keys for citations, not substitutes for reading the passage. |
| `edges[id]` | Directed `subject`–`relation`–`object` statements with a `source_id`. The `ontological_edge` schema checks their shape and relation vocabulary, with readable option labels. `included_in_model` is a modifiable selection flag. It determines whether a given simulation includes an edge; it does not change the philosophical claim. |

The `domain` and `category` fields provide a navigation hierarchy for the data. They are editorial classifications and must not be read as claims that, for example, every `principle` is a substance. Edge relation names are model vocabulary. Their meanings should be checked against the cited argument before computational use.

`latin_name` is a normalized Thomistic term for each concept, not a claim that every cited article uses that exact grammatical form. It is a searchable lexical aid alongside the stable ID and English label. The names for powers and senses were checked against the Latin [*Summa theologiae* I, qq. 77–83](https://www.corpusthomisticum.org/sth1077.html), and the passion names against [I–II, qq. 22–25](https://www.corpusthomisticum.org/sth2022.html). When a passage uses synonyms, the concept note and source must control interpretation; the English `aversion_passion`, for example, uses Aquinas's `fuga` in I–II, q. 23, a. 4.

A loader should validate that every edge endpoint names a concept, every `source_id` names a source, IDs are unique, and only `included_in_model` changes between the canonical files and a scenario. It should retain source IDs in the Rust representation and in outputs. The three DIPL schemas are declared on their map nodes, so new items inherit the same record contract. DIPL's `!constant` properties guard source and edge statement fields against ordinary later definitions; SNT3's explicit override mechanism can still replace them, so the loader must reject such overrides. Changes to concept definitions require scholarly review rather than a scenario override.

## Reading and extending the graph

The anthropological edges begin with [*Summa theologiae* I, qq. 75–83](https://www.newadvent.org/summa/1075.htm). The metaphysical edges use Aquinas's [*De principiis naturae*, §§1–20](https://www.jonhaines.com/thomas/english/DePrincNaturae.htm). The current links cite freely readable English editions; check translation rights before copying extended passages into data files.

The expanded human ontology follows these distinctions:

| Area | Encoded distinction and authority |
| --- | --- |
| Embodied human being | The human person has a body, and the rational soul is its substantial form. The vegetative, sensitive, and intellectual aspects are powers of the one soul, not three souls in one person ([I, q. 76, a. 1](https://www.newadvent.org/summa/1076.htm); [I, q. 78, a. 1](https://www.newadvent.org/summa/1078.htm)). |
| Vegetative and cognitive powers | Nutrition, growth, and generation are distinguished; the exterior senses and the human interior senses are grouped under sensitive power. Sensitive operations use bodily organs, whereas intellectual operation is distinguished in this respect ([I, q. 78, aa. 1–4](https://www.newadvent.org/summa/1078.htm); [I, q. 79, aa. 2–3](https://www.newadvent.org/summa/1079.htm)). |
| Appetite and choice | Sensitive appetite and will, the intellectual appetite, are distinct powers. The sensitive appetite includes concupiscible and irascible powers. Choice is an act of will, since Aquinas argues that will and free choice are one power ([I, q. 80, a. 2](https://www.newadvent.org/summa/1080.htm); [I, q. 81, a. 2](https://www.newadvent.org/summa/1081.htm); [I, q. 83, a. 4](https://www.newadvent.org/summa/1083.htm)). |
| Passions | Six named passions are assigned to the concupiscible appetite and five to the irascible appetite, following Aquinas's elevenfold division. These are types of movement in sensitive appetite, not eleven further soul powers ([I–II, q. 22, a. 3](https://www.newadvent.org/summa/2022.htm); [I–II, q. 23, a. 4](https://www.newadvent.org/summa/2023.htm)). The passion named hope is distinct from the [theological virtue of hope, II–II, q. 17, a. 1](https://www.newadvent.org/summa/3017.htm). |

The specific body node `bodily_organ` is deliberately generic. The present graph does not assign contemporary anatomical structures to Aquinas's faculties. Likewise, the graph does not treat a passion as morally good or bad simply because it has a name; Aquinas considers its relation to reason and will in [I–II, q. 24, a. 1](https://www.newadvent.org/summa/2024.htm).

Add a source record for each new passage, then concepts and edges that can be defended from it. Keep a distinction between an authoritative passage, its interpretation, and a scenario's choice to include it. Avoid making one relation do several kinds of work; for example, formal causation, membership, and temporal succession should have distinct relation names.

Validate the project with:

```sh
snt dip parse --project dip/DIPfile --print
```

The project entry point and option labels were checked with SNT3 0.9.4. A portable bundle can be produced when needed with `snt dip package --project dip/DIPfile --output project.bundle.json`; generated bundles should be treated as build artifacts.

Return to the [documentation index](index.md).
