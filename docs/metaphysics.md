# Metaphysical principles and their applications

The general metaphysical concepts are connected to the human and theological ontology through explicit, cited statements. The original thirteen principle IDs and nine edge IDs are preserved in [concepts](../dip/metaphysics_concepts.dip) and [edges](../dip/metaphysics_edges.dip). Additional [sources](../dip/metaphysics_sources.dip) support their applications. These are statements about kinds, principles, and causal roles; they do not make abstract concepts into independent agents.

## Distinctions and connections

| Distinction | Application in the graph | Primary source |
|---|---|---|
| Substantial and accidental form | The rational soul is a substantial form; an accidental form determines a subject already constituted. | [*De principiis naturae*, §§2–7](https://isidore.co/aquinas/english/DePrincNaturae.htm), [ST I76.1](https://www.newadvent.org/summa/1076.htm#article1) |
| Matter and form | The human composite has a material principle and is actualized by its soul. | [ST I76.1](https://www.newadvent.org/summa/1076.htm#article1) |
| Substance and accident | A human person is an individual substance; soul powers and habits are qualities of different kinds. | [ST I29.1](https://www.newadvent.org/summa/1029.htm#article1), [I77.1, ad 5](https://www.newadvent.org/summa/1077.htm#article1), [I–II49.1–2](https://www.newadvent.org/summa/2049.htm) |
| First and second actuality | The soul is first act in relation to operative powers; sensing and understanding are exercises of operation. | [ST I77.1](https://www.newadvent.org/summa/1077.htm#article1) |
| Passive potentiality and active power | Possible intellect receives intelligible actuality; agent intellect renders intelligibles actual. | [ST I79.2–3](https://www.newadvent.org/summa/1079.htm), [I25.1](https://www.newadvent.org/summa/1025.htm#article1) |
| Pure act and created actuality | God excludes passive potency and has active power; angels involve act and potency despite being immaterial. | [ST I3.2](https://www.newadvent.org/summa/1003.htm#article2), [I25.1](https://www.newadvent.org/summa/1025.htm#article1), [I50.2, ad 3](https://www.newadvent.org/summa/1050.htm#article2) |
| Modes of causality | Matter has a material role; form a formal role; God is the universal efficient cause and ultimate final cause of creatures. | [*De principiis naturae*, §20](https://isidore.co/aquinas/english/DePrincNaturae.htm), [ST I44.1–4](https://www.newadvent.org/summa/1044.htm) |
| Generation and creation | Generation presupposes matter; creation does not presuppose a material subject. | [*De principiis naturae*, §§6–8](https://isidore.co/aquinas/english/DePrincNaturae.htm), [ST I45.1–3](https://www.newadvent.org/summa/1045.htm) |
| Privation | Original sin includes deprivation of original holiness and justice. | [CCC404–405](https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_one/article_1/paragraph_7_the_fall.index.html) |
| Natural inclination | Natural appetite follows a thing's form and tends to its suitable good. | [ST I80.1](https://www.newadvent.org/summa/1080.htm#article1) |

The graph now provides routes such as human person → rational soul → substantial form → form → formal cause. These are sequences of distinct explanations; a path does not establish a further causal claim about its endpoints.

## Qualifications carried by the DIPL

- **The living body is already formed.** Its corporeality must not be identified with bare prime matter. The soul and body constitute one human being; the soul's subsistence does not make it a second complete human person.
- **Natural properties can be accidents in the predicamental sense.** Calling soul powers qualities does not say they are unimportant, contingent additions, or identical to habits. See the distinction between predicamental accident and the predicable in I77.1, ad 5.
- **Potentia has distinct senses.** The `potentiality` entry now covers the vocabulary of capacity, with explicit `active_power` and `passive_potentiality` entries. The older `potency_to_act` edge is qualified as referring to receptivity. God is never classified as a creature with an unrealized faculty.
- **First act is related to operation through powers.** The subject is in potency to operation through its power; actuality precisely as actuality is not a deficiency. A soul is not continually sensing or understanding merely because it is the form of a living body.
- **Angelic receptivity is immaterial.** The cited act/potency distinction concerns angelic nature and received existence; it does not assert bodily matter or human-style temporal learning.
- **Causal role is not taxonomic membership.** `god has_causal_role efficient_cause` identifies the respect in which God causes created being. It does not place God in a genus with creatures. Actual cause–effect statements, including `god is_final_cause_of created_being`, remain distinct edges.
- **Creation is not a material transition.** Its concept records giving being and creaturely dependence; no change in God or pre-existing matter is implied. Only God can create in this strict sense.
- **Privation is qualified by its subject and perfection.** The original-sin edge concerns deprivation of original holiness and justice. It licenses no inference that every lack, limitation, or material privation is a personal sin.

These qualifications are stored on the corresponding edges with `condition_source_id`; they are available in the viewer's concept panel and connection summaries. The new `formal` and `material` causal modes describe constitutive causality. Edges classifying a causal *role* use `noncausal` because the classification itself is not another cause–effect assertion.

## Connecting predicates to principles

The relation schema has an optional `principle_id`, an ordinary DIPL string containing a concept ID. For example:

```text
ontology
  relations[is_final_cause_of]
    principle_id = "final_cause"
```

This field is an editorial reference to the concept explaining a predicate. It is independent of the predicate's display color and does not generate an ontological edge, imply inheritance of agency, or substitute for an edge's passage citation. The shared graph validator rejects a reference to an unknown concept. Both delivery modes preserve the field.

In the concept panel, each applicable relation has a **Principle** button. Selecting the principle also shows **Relations using this principle**. Graph lines and path search continue to use the explicit cited edges, including the new metaphysical connections.

## Scope and review

The entries remain subject to the project's [scholarly review](method.md). The classification of quality under accidental form is marked as an interpretive inference. Schema conformance and graph connectivity verify structure, not the truth or completeness of the philosophical interpretation. A future simulator must separately justify numerical or temporal rules.

See [ontology data](ontology.md), [creation](creation.md), [passions](passions.md), and the [documentation index](index.md). Restart the local Python viewer after data changes, and rebuild the bundle for the static web mode.
