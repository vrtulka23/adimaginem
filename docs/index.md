# Ad Imaginem documentation

Ad Imaginem is an interactive atlas of Thomistic philosophy and Catholic theology. Aquinas's texts are authoritative for claims about his position; every modeled claim should identify its supporting passage and interpretation.

The project follows a [scholarly and Catholic method](method.md): claims about Aquinas, Catholic doctrine, and the graph encoding are identified and reviewed at their appropriate levels.

## New to the atlas?

Start with a [guided tour](guided-tours.md): choose a question and follow a short sequence of connected ideas. You do not need to install anything to use the published website.

In the graph, an icon represents a **concept**, such as the soul or a virtue. A line represents a **relation**: a specific claim connecting two concepts. Select a concept or inspect a relation to read its explanation and sources. The arrows follow the wording of the relation; closeness on the screen is a layout choice.

## About the research

Machine-learning tools helped discover the cited texts and passages and prepare the explanations. Errors in interpretation or philosophical coherence can be corrected in the repository's DIPL files and included in a rebuilt site. We welcome review by scholars, subject experts, and responsible Church authorities. See [editorial review and contributions](review-and-contributions.md) for the process and the distinction between source authority and our interpretation.

## Start exploring

- [Guided tours](guided-tours.md): cited introductions for interfaith dialogue, catalogue tags, and DIPL-authored scenes.
- [Study areas](study-areas.md): overlapping ethics, knowledge, natural philosophy, logic, and social philosophy filters.
- [Ontology graph explorer](../tools/README.md): a static Astro website or a standalone Python viewer.

## God, faith, and Christian life

- [Theological ontology](theology.md): grace, virtues, gifts, fruits, the Trinity, and sacraments.
- [Holy Trinity](trinity.md): divine unity, Word and Love, relations of origin, and the focused graph view.
- [Creation and created orders](creation.md): God as creator, angels and demons, embodied humans, animals, plants, and matter.
- [Mary and the saints](mariology.md): Theotokos, Marian teachings, intercession, and veneration.
- [Heaven, Hell, Purgatory, and resurrection](eschatology.md): judgment, purification, prayer for the dead, and final fulfillment.

## The human person and philosophical questions

- [First principles and doctrinal foundations](foundations.md): truth and being, conscience and natural law, Christ's saving work, revelation, Church, and Eucharistic doctrine.
- [Metaphysical foundations](metaphysics.md): how matter, form, act, potency, substance, accidents, and causes connect to the rest of the ontology.
- [Passions and their interrelations](passions.md): objects, contraries, natural ordering, and conditional influences.
- [Sin and angelic ministry](sin-and-angels.md): wounds of human powers, conversion, temptation, guardianship, and angelic orders.
- [Spiritual warfare and deliverance](spiritual-warfare.md): prayer, affliction, oppression/vexation, possession, and exorcism, with source-specific distinctions.

## Read and check the sources

- [Resources and source practice](resources.md): primary texts, relevant passages, a starting conceptual map, and citation guidance.
- [Scholarly and Catholic method](method.md): interpretive authorities and review standards for model claims.
- [Grounding and historical sources](grounding-and-sources.md): claim-level assessments, biblical references, philosophical arguments, and doctrinal standing.

- [Editorial review and contributions](review-and-contributions.md): machine-assisted research, corrections, and expert review.

## For contributors: data and software

- [Ontology data](ontology.md): structure and source provenance of the DIPL concept and edge graph.
- [Running and publishing](running.md): setup commands, local viewing, DIPH5 persistence, and GitHub Pages.
- [Architecture](architecture.md): the Astro website, DIPL data flow, shared validation, and Python viewer.
- [Dependencies and data formats](dependencies.md): SNT3/DIPL and the rules for other serialization formats.
- [Graph layout controls](graph-layout.md): DIPL attraction, spacing, collision, cooling, and calculated geometry.

## A few useful terms

- **Ontology**: an organized account of what kinds of things there are and how they relate.
- **Thomistic**: drawing on the philosophy and theology of St Thomas Aquinas.
- **Provenance**: where a statement comes from, including its cited passage.
- **DIPL**: the structured text format used to store the atlas's concepts, relations, citations, and settings in `dip/`.
- **Draft**: our explanation or data record still awaits scholarly review. The label concerns our work, not the authority of the cited teaching.

Each topic page keeps the detailed distinctions, citations, and implementation notes for readers who want to go further.
