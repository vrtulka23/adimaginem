# Sin, human powers, and angelic ministry

These modules extend the [theological ontology](theology.md) with cited claims about moral disorder, recovery, angelic influence, and angelic orders. They are a structural knowledge base. All new concepts and edges retain `review_status = "draft"`; the graph does not judge an individual's culpability or identify a supernatural cause of a particular experience.

## Data files

| Module | Concepts | Relations | Sources |
|---|---|---|---|
| Sin and its effects | [sin_concepts.dip](../dip/sin_concepts.dip) | [sin_edges.dip](../dip/sin_edges.dip) | [sin_sources.dip](../dip/sin_sources.dip) |
| Angelic influence | [angelic_influence_concepts.dip](../dip/angelic_influence_concepts.dip) | [angelic_influence_edges.dip](../dip/angelic_influence_edges.dip) | [angelic_influence_sources.dip](../dip/angelic_influence_sources.dip) |
| Angelic orders | [angelic_orders_concepts.dip](../dip/angelic_orders_concepts.dip) | [angelic_orders_edges.dip](../dip/angelic_orders_edges.dip) | [angelic_orders_sources.dip](../dip/angelic_orders_sources.dip) |

Every concept has a Latin name. Some names for offices and cognitive operations are normalized descriptions, not verbatim technical terms. Every edge identifies its authority and has a local `?rationale`; restrictions carry their own `condition_source_id`.

## Sin and the exercise of human powers

`original_sin` is an inherited state, while `personal_sin` concerns culpable acts, including voluntary omissions. They are not put in an unqualified species/genus relationship: original sin is called sin analogically. Baptism removes original sin while consequences for nature remain. [Catechism §§404–405](https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_one/article_1/paragraph_7_the_fall.html).

The four wounds connect to existing powers: ignorance to intellect/reason, malice to will, weakness to irascible appetite, and disordered concupiscence to concupiscible appetite. `wounds_order_of` means disorder of orientation, not destruction of a faculty. Personal sin can aggravate the wounds. [*ST* I–II, q. 85, aa. 1–3](https://www.newadvent.org/summa/2085.htm#article3).

Practical judgment links these disorders to the existing cognitive model. Disordered passion can affect imagining and impede judgment; judgment presents a good to will. These are possible influences, not an inevitable sequence in every choice. [I–II, q. 77, aa. 1–2](https://www.newadvent.org/summa/2077.htm#article1). Blindness of mind and dullness of understanding refer here to the culpable intellectual disorders Aquinas discusses; natural incapacity is explicitly distinguished. Their mappings to the gift of understanding are marked interpretive. [II–II, q. 15, aa. 1–2](https://www.newadvent.org/summa/3015.htm#article1).

Vice is a habitual disposition, distinguished from a sinful act. [I–II, q. 71, aa. 1, 6](https://www.newadvent.org/summa/2071.htm#article1). Repetition can establish vice, which inclines toward further sin. [Catechism §1865](https://www.vatican.va/content/catechism/en/part_three/section_one/chapter_one/article_8/v_the_proliferation_of_sin.html).

### Gravity and conversion

The three `requires` edges from `mortal_sin` are **jointly necessary**: grave matter, full moral knowledge, and deliberate consent. An individual edge is not a sufficient test. Mortal sin entails deprivation of charity and sanctifying grace; venial sin wounds charity without removing sanctifying grace. The aversion from God concerns the ultimate end, not spatial distance. [Catechism §§1854–1863](https://www.vatican.va/content/catechism/en/part_three/section_one/chapter_one/article_8/iv_the_gravity_of_sin_mortal_and_venial_sin.html).

Conversion, repentance, and justification also connect to grace, God, remission of sin, and Penance. The free movements of adult justification are qualified by the recipient's use of reason; they are not imposed as requirements on infants. [I–II, q. 113, aa. 3–6](https://www.newadvent.org/summa/2113.htm#article3).

## Angelic influence and its limits

The model records capacities to illuminate human intellect, influence imagination and senses, and persuade. It also records explicit exclusions: created angelic influence cannot compel deliberate consent, and angelic illumination does not infuse the habit of faith. [I, q. 111, aa. 1–4](https://www.newadvent.org/summa/1111.htm#article1).

Aquinas explains sensory and imaginative mediation using the physiology available to him. The graph retains the cited relation to embodied operations; it does not implement his discussion of humors as a modern physiological mechanism.

Demonic suggestion is a kind of temptation. Temptation inclines toward wrongdoing; it is distinct from consent. A personal sin need not involve a particular demonic suggestion, although Aquinas also discusses the indirect historical role of the first temptation. [I, q. 114, aa. 2–3](https://www.newadvent.org/summa/1114.htm#article2).

Angelic guardianship is an office under divine providence. Particular guardianship has individual humans as recipients; it is distinguished from universal care and does not add a tenth angelic order. [I, q. 113, aa. 1–3](https://www.newadvent.org/summa/1113.htm#article1).

## Orders, hierarchies, and characteristic ministries

The nine named orders and three hierarchies use dedicated categories. Orders are collective ranks, connected to blessed angels by `has_members_of_kind`; they are not treated as individual substances. The blessed offices are not automatically assigned to fallen angels. [I, q. 108, aa. 1–4](https://www.newadvent.org/summa/1108.htm#article1).

The encoded ranking follows the **Dionysian arrangement expounded by Aquinas**:

| Hierarchy | Orders, highest first |
|---|---|
| First | Seraphim, Cherubim, Thrones |
| Second | Dominions, Virtues, Powers |
| Third | Principalities, Archangels, Angels |

Each order has a separate characteristic-perfection or ministry node. These include charity, knowledge, receptivity to divine government, direction, strength, ordering, leadership, and announcement. The relations do not make these perfections exclusive possessions. Aquinas also reports Gregory's different placement of Virtues and Principalities; each hierarchy/ranking edge identifies the arrangement being used. Gregory's account of greater announcements is identified in the relevant concept. [I, q. 108, aa. 5–6](https://www.newadvent.org/summa/1108.htm#article5).

The lowest order connects to individual guardianship. Powers connect to restraint of demons, explicitly citing Gregory's ministerial account as reported by Aquinas and acknowledging participation by lower angels. [I, q. 113, a. 3](https://www.newadvent.org/summa/1113.htm#article3).

## Reading the graph

- `can_influence`, `can_perform`, `can_impede`, and similar predicates express capacities or possibilities.
- `cannot_compel`, `does_not_require`, and other negative predicates express limits. A path containing them is not a positive causal chain.
- `requires` is necessity, not sufficiency; the loader does not execute logical conjunctions or diagnose personal states.
- `is_higher_order_than` is a source-specific ranking, not a causal relation.
- Human recipients are distinguished from blessed angelic recipients. Angelic intellectual perfections do not imply human sensitive passions.

All predicates are classified in [relations.dip](../dip/relations.dip) and included in the edge schema's DIPL options and labels. The browser adds separate color groups for moral disorders and angelic orders/ministry; display groups remain editorial aids. Selecting a node shows citations, qualifications, and direction. Graph paths support exploration rather than automatic theological inference.

## Sin, intellect, and reconciliation tour

The guided tour **Sin, the intellect, and reconciliation** has seven scenes: the subject of sin, wounded powers, clouded judgment, mortal and venial sin, conversion, sacramental absolution, and continuing healing.

The new `can_have_subject` relations distinguish the will as a subject of voluntary sin and intellect as a possible subject when its disorder is voluntary. Their conditions exclude treating every error as culpable. The source is Aquinas, [ST I-II, q. 74, aa. 1–2 and 5](https://www.newadvent.org/summa/2074.htm). “In” a faculty names the subject of an act, not a physical storage location. The inherited condition of original sin is distinguished from personal acts.

The existing wound relations are retained: intellectual power is not destroyed by sin; its ordering toward truth can be impeded. Spiritual blindness does not mean that disability or every difficulty in understanding is caused by a person's sins.

[reconciliation_concepts.dip](../dip/reconciliation_concepts.dip) adds contrition, sacramental confession, absolution, and satisfaction. Their connections in [extension_edges.dip](../dip/extension_edges.dip) distinguish God's forgiveness through sacramental absolution from the continuing repair of harm and healing of residual dispositions. See [ST III, q. 84, a. 3](https://www.newadvent.org/summa/4084.htm#article3), [ST III, q. 86, aa. 5–6](https://www.newadvent.org/summa/4086.htm), and [CCC 1451–1460](https://www.vatican.va/content/catechism/en/part_two/section_two/chapter_two/article_4/vii_the_acts_of_the_penitent.html).

