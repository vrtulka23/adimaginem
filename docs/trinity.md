# The Holy Trinity

The Trinity focus uses the existing `God & Trinity` display group. Its records are in [concepts](../dip/trinity_concepts.dip), [edges](../dip/trinity_edges.dip), and [sources](../dip/trinity_sources.dip). All claims are sourced paraphrases. English graph predicates, record IDs, categories, and Latin labels are editorial vocabulary; they are not presented as verbatim quotations.

## Reading the connections

| Question | Recorded distinction | Primary authority |
|---|---|---|
| One God or three? | Each person is the one undivided divine essence. Personal distinction does not divide that essence. | [Catechism §§253–255](https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_one/article_1/paragraph_2_the_father.index.html) |
| Why Word? | `eternal_word` names the Son, without adding another person. | [ST I, q. 34, a. 2, respondeo and ad 1–3](https://www.newadvent.org/summa/1034.htm) |
| Why Love? | `subsistent_love` names the Holy Spirit personally; `divine_love` names essential love common to all three. | [ST I, q. 37, a. 1, respondeo and ad 1–4](https://www.newadvent.org/summa/1037.htm) |
| What does procession mean? | Intellectual generation and procession by love are internal origins, without bodily reproduction or creation. | [ST I, q. 27, aa. 1–4](https://www.newadvent.org/summa/1027.htm) |
| What distinguishes persons? | Paternity, filiation, and personal procession are subsisting personal relations. | [ST I, q. 29, a. 4](https://www.newadvent.org/summa/1029.htm); [q. 30, a. 2](https://www.newadvent.org/summa/1030.htm) |
| Why not four persons? | Common spiration belongs to Father and Son without constituting another person. | [ST I, q. 30, a. 2, ad 1](https://www.newadvent.org/summa/1030.htm) |
| Does the Spirit have two independent principles? | Father and Son spirate as one principle. The two existing origin edges must be read together. | [ST I, q. 36, a. 4](https://www.newadvent.org/summa/1036.htm) |
| Is the Son later or spatially separate? | Coeternity and mutual indwelling exclude temporal succession and spatial separation. | [ST I, q. 42, aa. 2, 5](https://www.newadvent.org/summa/1042.htm) |
| Do the persons compose God? | Divine simplicity excludes composition. | [ST I, q. 3, a. 7](https://www.newadvent.org/summa/1003.htm) |
| Do they act as three creators? | Creation belongs to all three through the one essence. | [ST I, q. 45, a. 6](https://www.newadvent.org/summa/1045.htm) |

The distinction between God's inner life and his works toward creatures follows [Catechism §236](https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_one/article_1/paragraph_2_the_father.index.html). The focus presents that teaching through cited concepts and relations; the spatial graph is a navigation aid.

## Limits of the representation

Aquinas explicitly denies that natural reason alone establishes the Trinity. The theological account begins from revelation; philosophical distinctions help explain it and address objections. The model must not present an analogy or a graph path as a demonstration that compels assent from someone who does not accept those authorities. This methodological limit is itself grounded in [ST I, q. 32, a. 1, respondeo](https://www.newadvent.org/summa/1032.htm).

`divine_name` records names, and `divine_relation` records relations. Neither category adds divine persons. The existing `god`, `trinity`, and `divine_essence` records also do not denote additional gods. The three personal records remain Father, Son, and Holy Spirit.

The new Trinitarian edges and the existing generation and procession edges have `causal_mode = "noncausal"` and the default explanation role `context`. Here this marks their exclusion from the model's creaturely causal transitions; it does not deny eternal origin from a principle. These edges cannot be composed into a temporal chain or interpreted as one person controlling another. `has_one_divine_essence` does not mean having a component or belonging to a species.

Personal distinction, coeternity, mutual indwelling, and relative opposition are symmetric in meaning. The current directed graph stores one record per pair; its arrow indicates the stored statement's orientation. Directed path search does not automatically infer the reverse edge. Likewise, naming and essence statements are not unrestricted computational equality: they do not license merging distinct persons.

All new encodings retain `draft` review status. Source-backed paraphrases still require scholarly review of their wording and computational use.

## In the viewer

Enable **Focus: Holy Trinity** to restrict the graph to the existing DIPL display group. The introductory text and citation come from the Trinity concept. Other filters continue to apply; disable focus to explore relations with creation, grace, and human ontology. Select any concept for its cited connections, or connect two concepts for the existing path explanation.

The focus reuses color-category metadata. `study_focus_concept` and `study_focus_enabled` are DIPL viewer parameters. No separate hand-maintained list of Trinity nodes or generated theological prose is used.
