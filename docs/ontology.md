# Ontology data in DIPL

The [`dip/DIPfile`](../dip/DIPfile) is the SNT3 project entry point. It loads the original [concepts](../dip/concepts.dip), [sources](../dip/sources.dip), and [edges](../dip/edges.dip), plus [appetite distinctions](../dip/appetite.dip), [acts and habits](../dip/acts_habits.dip), [passion profiles](../dip/passion_profiles.dip), the [theological ontology](theology.md), [creation](creation.md), and the [relation vocabulary](../dip/relations.dip), with reusable schemas in [`dip/schemas/`](../dip/schemas/). The graph is a scholarly representation of selected passages, not a claim that a DIPL node is a human being or a spiritual soul. Extend it passage by passage under the [scholarly method](method.md).

## Data contract

The `ontology` tree has five collections:

| Collection | Purpose |
| --- | --- |
| `concepts[id]` | Stable concept IDs with an English `label`, a `latin_name`, an editorial `domain` and `category`, a short note, a `source_id`, and a `review_status`. The `ontological_concept` schema checks their shape and controlled values and gives options readable labels. |
| `sources[id]` | Passage-level provenance: `authority_kind`, author, work, precise locator, and edition URL. The `ontological_source` schema checks the record shape. IDs are stable keys for citations, not substitutes for reading the passage. |
| `edges[id]` | Directed `subject`–`relation`–`object` statements with a `source_id`. Each `source_id` value carries a `?rationale` explaining why that passage supports the edge. The `ontological_edge` schema checks the relation vocabulary, `evidence_kind`, and `review_status` with readable option labels. `included_in_model` selects edges for a simulation; it does not change a philosophical claim. |
| `relations[id]` | Editorial definitions of the edge predicates, each with a label, description, and classified `kind`. The `ontological_relation` schema checks the kind. Every edge relation must exist in this registry. |
| `passion_profiles[id]` | Editorial formal profiles for the eleven sensitive passions: appetite, object aspect, arduousness, phase, and temporal relation. The `passion_profile` schema checks options and defaults `evidence_kind` to `editorial_classification` and `review_status` to `draft`. Each local `source_id` carries a `?rationale`. |

The `domain` and `category` fields provide a navigation hierarchy for anthropology, metaphysics, and theology. They are editorial classifications and must not be read as claims that, for example, every `principle` is a substance. Edge relation names are model vocabulary. Their meanings should be checked against the cited argument before computational use.

`latin_name` is a normalized Thomistic term for each concept, not a claim that every cited article uses that exact grammatical form. It is a searchable lexical aid alongside the stable ID and English label. The names for powers and senses were checked against the Latin [*Summa theologiae* I, qq. 77–83](https://www.corpusthomisticum.org/sth1077.html), and the passion names against [I–II, qq. 22–25](https://www.corpusthomisticum.org/sth2022.html). When a passage uses synonyms, the concept note and source must control interpretation; the English `aversion_passion`, for example, uses Aquinas's `fuga` in I–II, q. 23, a. 4.

An edge's `evidence_kind` distinguishes a textual paraphrase from an interpretive inference or editorial classification. Concepts and edges currently default to `draft` review status; `reviewed` and `contested` are reserved for an explicit scholarly decision. The `?rationale` is attached to the locally declared scalar `source_id`: DIPL does not allow metadata on a map item, and SNT3 0.9.4 does not retain item-level metadata added to a value declared by a collection schema. The rationale explains why that citation supports the claim; it is not a quotation. The loader checks that every edge defines a `source_id`, since this field is declared locally to preserve its rationale metadata.

The [first Rust loader](architecture.md#first-executable-slice) validates edge endpoints, registered relation names, source references, and rationales. It also checks that every passion profile names an existing passion, agrees with its appetite edge, and has a citation and rationale. DIPL map keys identify records; the SNT evaluation forms the graph consumed by Rust. The five DIPL schemas are declared on their map nodes, so new items inherit the same record contract. The data currently has no `!constant` markers; therefore a future scenario review workflow must compare a scenario with the canonical project and allow only `included_in_model` to vary without scholarly review. Changes to concept definitions, citations, and edge claims require such review.

## Reading and extending the graph

The anthropological edges begin with [*Summa theologiae* I, qq. 75–83](https://www.newadvent.org/summa/1075.htm). The metaphysical edges use Aquinas's [*De principiis naturae*, §§1–20](https://www.jonhaines.com/thomas/english/DePrincNaturae.htm). The current links cite freely readable English editions; check translation rights before copying extended passages into data files.

The expanded human ontology follows these distinctions:

| Area | Encoded distinction and authority |
| --- | --- |
| Embodied human being | The human person has a body, and the rational soul is its substantial form. The vegetative, sensitive, and intellectual aspects are powers of the one soul, not three souls in one person ([I, q. 76, a. 1](https://www.newadvent.org/summa/1076.htm); [I, q. 78, a. 1](https://www.newadvent.org/summa/1078.htm)). |
| Vegetative and cognitive powers | Nutrition, growth, and generation are distinguished; the exterior senses and the human interior senses are grouped under sensitive power. Sensitive operations use bodily organs, whereas intellectual operation is distinguished in this respect ([I, q. 78, aa. 1–4](https://www.newadvent.org/summa/1078.htm); [I, q. 79, aa. 2–3](https://www.newadvent.org/summa/1079.htm)). |
| Appetite and choice | Sensitive appetite and will, the intellectual appetite, are distinct powers. The sensitive appetite includes concupiscible and irascible powers. Choice is an act of will, since Aquinas argues that will and free choice are one power ([I, q. 80, a. 2](https://www.newadvent.org/summa/1080.htm); [I, q. 81, a. 2](https://www.newadvent.org/summa/1081.htm); [I, q. 83, a. 4](https://www.newadvent.org/summa/1083.htm)). |
| Formal objects of appetite | Natural appetite follows natural form; the sensitive appetites concern sensible good or evil, with the irascible attending to difficulty; the will tends toward good as apprehended ([I, q. 80, a. 1](https://www.newadvent.org/summa/1080.htm); [I, q. 81, a. 2](https://www.newadvent.org/summa/1081.htm); [I–II, q. 8, a. 1](https://www.newadvent.org/summa/2008.htm)). |
| Passions | Six named passions are assigned to the concupiscible appetite and five to the irascible appetite, following Aquinas's elevenfold division. These are types of movement in sensitive appetite, not eleven further soul powers ([I–II, q. 22, a. 3](https://www.newadvent.org/summa/2022.htm); [I–II, q. 23, a. 4](https://www.newadvent.org/summa/2023.htm)). The passion named hope is distinct from the [theological virtue of hope, II–II, q. 17, a. 1](https://www.newadvent.org/summa/3017.htm). |
| Cognition and practical action | Phantasms, intelligible species, agent intellect, possible intellect, and understanding are linked to represent embodied human knowing ([I, qq. 79, 84–85](https://www.newadvent.org/summa/1085.htm)). Practical intellect and will are connected in distinct respects: intellect specifies the object, and will moves powers as to exercise ([I–II, q. 9, a. 1](https://www.newadvent.org/summa/2009.htm)). Counsel precedes choice in practical order ([I–II, q. 14, a. 1](https://www.newadvent.org/summa/2014.htm)). |
| Cardinal virtues and powers | Prudence is assigned to reason, justice to will, fortitude to irascible appetite, and temperance to concupiscible appetite ([I–II, q. 61, a. 2](https://www.newadvent.org/summa/2061.htm)). |

The specific body node `bodily_organ` is deliberately generic. The present graph does not assign contemporary anatomical structures to Aquinas's faculties. Likewise, the graph does not treat a passion as morally good or bad simply because it has a name; Aquinas considers its relation to reason and will in [I–II, q. 24, a. 1](https://www.newadvent.org/summa/2024.htm).

The passion profiles normalize Aquinas's distinctions in [I–II, q. 23, aa. 3–4](https://www.newadvent.org/summa/2023.htm). `phase` denotes how a passion relates to its object, not a measured psychological intensity. `temporal_relation = "present"` includes a good attained or an evil already encountered. These fields support classification and must not be treated as a complete causal theory of emotion.

Add a source record for each new passage, then concepts and edges that can be defended from it. Keep a distinction between an authoritative passage, its interpretation, and a scenario's choice to include it. Avoid making one relation do several kinds of work; for example, formal causation, membership, and temporal succession should have distinct relation names.

Validate the project with:

```sh
snt dip parse --project dip/DIPfile --print
```

The project entry point and option labels were checked with SNT3 0.9.4. A portable bundle can be produced when needed with `snt dip package --project dip/DIPfile --output project.bundle.json`; generated bundles should be treated as build artifacts.

Return to the [documentation index](index.md).
