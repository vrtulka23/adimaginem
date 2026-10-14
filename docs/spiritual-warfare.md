# Spiritual warfare and deliverance

This module adds 13 concepts and 39 cited relations to the existing account of temptation, human freedom, grace, and angelic ministry. All encodings remain drafts for scholarly review.

## Canonical data

- [Concepts](../dip/spiritual_warfare_concepts.dip): Latin names, definitions, study areas, and citations.
- [Relations](../dip/spiritual_warfare_edges.dip): directed claims, `?rationale`, conditions, and evidence classifications.
- [Sources](../dip/spiritual_warfare_sources.dip): passage-level references and kinds of authority.

Both native Python and static WebAssembly load these same DIPL records. The graph adds **Prayer & spiritual combat** and **Demonic affliction** color groups; sacramentals remain with sacramental ministry.

## What the distinctions mean

| Concept | Scope in this model |
|---|---|
| Spiritual warfare / combat | Perseverance against temptation and evil; connected to vigilance and ordinary Christian life. |
| Demonic affliction | A broad heading for the influence discussed by the sources. |
| Oppression / vexation | One source-qualified pastoral concept, with both names searchable in its label. |
| Possession | A distinct condition, connected to bodily activity and an explicit limit against compelling consent. |
| Deliverance from evil | The good sought in prayer; wider than liberation from possession. |
| Exorcism | A sacramental ministry, distinguished from Penance and from ordinary private supplication. |

The pastoral terminology follows only the naming discussion in the Catholic Psychotherapy Association's [2022 guidelines, printed pp. 8–9](https://catholicpsychotherapy.org/wp-content/uploads/2023/04/Guidelines-for-Mental-Health-Professionals-Supporting-Persons-Seeking-Freedom-2nd-ed-Final-2.pdf). These authors acknowledge differing uses of the terms. Their vocabulary is **pastoral literature**, not Aquinas's taxonomy or a magisterial definition. Grouping the two names is explicitly editorial. The model does not import that document's symptom lists, etiological claims, or proposed degrees of possession.

The [1999 Vatican presentation of the exorcism rite](https://www.vatican.va/roman_curia/congregations/ccdds/documents/rc_con_ccdds_doc_1999-01-26_il-rito-degli-esorcismi_it.html) provides the bodily-activity/free-will distinction. Its Italian *ossessione* also illustrates why vocabulary cannot be mapped mechanically across sources. No progression from temptation through oppression to possession is asserted.

## Connections to the existing ontology

Aquinas places demonic assault under providence and identifies grace and angelic guardianship as aids to resistance. [ST I, q. 114, a. 1](https://www.newadvent.org/summa/1114.htm#article1).

Prayer connects directly to intellect, will, God, and providence. Petition is an intellectual act moved by will; it does not change God's eternal disposition. [ST II–II, q. 83, aa. 1–2](https://www.newadvent.org/summa/3083.htm#article1).

Prayer, Eucharistic worship, and reconciliation connect to spiritual combat. These edges describe support for perseverance, with no numeric protection score. [Gaudete et exsultate 158–164](https://www.vatican.va/content/francesco/en/apost_exhortations/documents/papa-francesco_esortazione-ap_20180319_gaudete-et-exsultate.html).

Deliverance connects to Christ's Passion and the Father's hearing of the Church's petition. [CCC 2853–2854](https://www.usccb.org/sites/default/files/flipbooks/catechism/688/).

Sacramentals are distinguished from sacraments and linked to disposition toward grace. [CCC 1667–1673](https://www.vatican.va/content/catechism/en/part_two/section_two/chapter_four/article_1.html).

The authorized-exorcist office records Latin Church discipline, including special and express permission of the local ordinary. [Canon 1172](https://www.vatican.va/archive/cod-iuris-canonici/eng/documents/cic_lib4-cann1166-1190_en.html). Baptismal and major exorcism have separate nodes. [USCCB explanation](https://www.usccb.org/prayer-and-worship/sacraments-and-sacramentals/sacramentals-blessings/exorcism).

## Computational meaning

These are source-qualified statements available for graph queries and explanations. `included_in_model` includes a statement in the knowledge graph; it does not activate a supernatural simulation rule. No symptoms, probabilities, severity scales, diagnosis rules, or culpability judgments are added.

`petitions_for` distinguishes asking for a good from necessarily producing it. `is_exercised_in_name_of` records the ministry's dependence on Christ's authority. Neither is an executable causal operator. Negative relations and distinctions must retain their meaning when traversing a graph path.

Illness and possession are explicitly distinguished by CCC 1673; the major-exorcism edge carries the assessment qualification. Source-specific affliction terminology must never be used to infer a supernatural cause from ordinary physical or psychological experiences.
