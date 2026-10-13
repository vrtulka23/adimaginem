# Domains, study areas, and concept categories

Concepts can participate in several fields of inquiry. The project records this without duplicating concepts or adding ontological edges solely for navigation.

| Field | Meaning | Example: prudence |
| --- | --- | --- |
| `domain` | The existing broad editorial placement: anthropology, metaphysics, or theology | `anthropology` |
| `study_areas` | A nonempty array of overlapping areas useful for inquiry and filtering | `anthropology`, `ethics`, `knowledge_truth`, `social_political` |
| `category` | The kind of entry within the model | `virtue` |

Graph color groups provide a separate visual organization. Selecting a study area filters concepts while preserving these colors. Membership is an **editorial classification**, not a new assertion about a concept's nature, a causal relation, or a claim that Aquinas used precisely this taxonomy.

## Registered areas

The [study-area registry](../dip/study_areas.dip) declares its [schema](../dip/schemas/study_area.dipl) on the map node. Every area has an English label, a Latin lexical aid, a description, a scope citation, and an explicit qualification.

| Area | Scope and source |
| --- | --- |
| Human ontology — *de homine* | Human nature, soul, body, powers, acts, and dispositions. [ST I75.4](https://www.newadvent.org/summa/1075.htm#article4) distinguishes the human being from the soul alone. |
| Metaphysics — *metaphysica* | Being and its principles. [*Super Boetium De Trinitate*, q. 5, aa. 1–2](https://isidore.co/aquinas/english/BoethiusDeTr.htm) provides distinctions between speculative sciences. |
| Catholic theology — *sacra doctrina* | God and creatures as considered in sacred doctrine. [ST I1.1–4](https://www.newadvent.org/summa/1001.htm) explains its revealed principles and speculative and practical scope. |
| Natural philosophy — *philosophia naturalis* | Corporeal nature, living things, natural change, and their principles. [*Super Boetium De Trinitate*, q. 5, a. 2](https://isidore.co/aquinas/english/BoethiusDeTr.htm) includes the soul as the perfection of a mutable living thing (ad 6), and distinguishes immaterial creatures' dependence on God from natural motion (ad 7). |
| Ethics and moral life — *philosophia moralis* | Voluntary action and its order, including habits, passions, virtues, and vices. [*Sententia libri Ethicorum*, I, lectio 1, nn. 1–6](https://isidore.co/aquinas/Ethics1.htm) distinguishes moral inquiry from other orders considered by reason. Our filter includes related moral theology while retaining its distinct principles. |
| Knowledge and truth — *cognitio et veritas* | Cognition, understanding, judgment, and impediments to knowledge. [ST I16.1–2](https://www.newadvent.org/summa/1016.htm) anchors the treatment of truth and intellectual judgment; individual cognition concepts retain their own sources. This is a modern organizational heading, not a claim that Aquinas established an independent science called epistemology. |
| Logic — *logica* | The order of intellectual operations and reasoning. Aquinas's own [foreword to the *Posterior Analytics* commentary](https://isidore.co/aquinas/english/PostAnalytica.htm#02) distinguishes the operations treated by logic. The current selection contains only a few relevant intellectual concepts; propositions, syllogisms, and demonstration are not yet independently modeled. |
| Social and political philosophy — *scientia civilis* | Human dealings with others and the ordering of communal life. [*Sententia libri Ethicorum*, I, lectio 1, nn. 1–6](https://isidore.co/aquinas/Ethics1.htm) distinguishes individual, household, and political moral inquiry. The initial selection includes justice, prudence, concord, and related acts. Law, authority, and common good need a fuller future module. |

These groupings are intentionally overlapping. They do not form a complete historical division of all sciences: mathematics and the mechanical arts, for example, are outside the current study-area registry. Latin labels are lexical aids; *cognitio et veritas* and *de homine* serve as descriptive headings.

## Memberships in DIPL

[Explicit memberships](../dip/study_memberships.dip) extend existing concept records through their paths:

```text
ontology
  concepts[prudence_virtue].study_areas str[1:] = ["anthropology", "ethics", "knowledge_truth", "social_political"]
```

The scope citation explains the field of inquiry; the concept's original `source_id` continues to support its definition. Membership generates no graph edges, causal rules, or transitive theological claims. The broader ethics filter does not classify grace as naturally acquired virtue, and the natural-philosophy filter does not make the intellect a bodily organ.

The DIPL schema requires at least one string and carries the common editorial `?rationale`. Rust validates each ID against `ontology.study_areas`, rejects duplicate or empty memberships, and verifies area citations and their editorial status. The browser adapter validates membership references too. Both loaders normalize SNT's singleton-array scalar rendering into a one-item array; the WebAssembly loader also verifies its declared shape. SNT's current `!options` checks an entire array value, so it cannot serve as an element-wise foreign-key constraint here. The study-area schema does use `!options` and `!labels` for its editorial evidence kind.

## Using the graph

Expand **Study areas** in the left sidebar. Check one or more areas to show the union of their memberships. Unchecking the last area, or pressing **Clear study-area filter**, restores all areas. Domain, Trinity-focus, and relation filters continue to apply; a displayed relation requires both endpoints to pass the concept filters. Connection search, summaries, and the selected concept's connected-relation list use the same filtered graph. The list updates immediately when filters change and reports when no connected relations are displayed.

**About selected areas** shows the DIPL descriptions, qualifications, Latin names, and source links. Each concept panel also lists its study areas. Counts next to area labels are total memberships before other filters.

Both the native Python viewer and static WebAssembly viewer use this data. Restart the Python server after changing DIPL, and rebuild the static bundle. See [running the viewer](../tools/README.md).
