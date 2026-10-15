# Grounding and historical sources

The graph records **how a particular claim is supported**, with the distinctions required by the [scholarly and Catholic method](method.md). A concept can have several assessments, and relations have their own assessments. Neither a source's age nor its presence in the bibliography assigns a doctrinal grade.

## Four questions

| Question | DIPL field | Meaning |
| --- | --- | --- |
| How is this claim knowable? | `support_records[].grounding` | Natural reason, divine revelation, reasoning from revelation, or unassessed. More than one assessed basis is possible. |
| What kind of historical witness is cited? | `sources[].witness_kind` | Scripture, ancient philosophy, patristic or scholastic writing, a magisterial document, ecclesial guidance, or pastoral literature. |
| What does this passage supply? | `support_records[].support_kind` | An explicit statement, philosophical argument, theological inference, typological interpretation, doctrinal formulation, terminology, or editorial classification. |
| What doctrinal standing has been established? | `support_records[].doctrinal_status` and `status_source_id` | A separately sourced assessment, with unassessed as the default. |

These are editorial descriptions justified by the cited passage. They are not numerical confidence scores. Natural reason and revelation can concern the same truth: Aquinas distinguishes their modes of treatment in [ST I, q. 1, a. 1, ad 2](https://www.newadvent.org/summa/1001.htm), and [Dei verbum 6](https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/vat-ii_const_19651118_dei-verbum_en.html) affirms natural knowledge of God alongside revelation. The Trinity is treated differently: [ST I, q. 32, a. 1](https://www.newadvent.org/summa/1032.htm) denies that its personal distinctions can be discovered by natural reason.

**Unassessed means no assessment has been recorded.** It does not mean untrue, unsupported, nonbiblical, or merely optional. Similarly, `review_status = draft` describes the project's editorial review, not the truth or authority of a Church teaching.

## Source practice

The initial assessments use primary philosophical and theological texts, identified biblical translations, and official Church documents. They do not use popular apologetics or pastoral anecdotes to establish philosophical arguments or doctrine. Existing pastoral bibliography remains explicitly identified; none of the new assessments relies on it.

- **Aquinas:** the cited article and relevant respondeo or reply govern the claim. The assessed Summa passages identify the Fathers of the English Dominican Province translation, second revised edition (1920), as reproduced by New Advent. This accessible edition is not a modern critical edition; contested terminology still requires the Latin and scholarly comparison.
- **Aristotle:** [De anima II.1, 412a6–412b9](https://classics.mit.edu/Aristotle/soul.2.ii.html), J. A. Smith's translation, supplies philosophical background to the soul as form and actuality. This witness does not establish all of Aquinas's theses about the rational soul.
- **Scripture:** the records use the USCCB's online **New American Bible, Revised Edition (NABRE)**, with separate book, chapter, start verse, and end verse fields. The passage's text is distinguished from the site's editorial notes. For example, [Matthew 28:19](https://bible.usccb.org/bible/matthew/28) witnesses to the baptismal naming of Father, Son, and Holy Spirit; the assessment does not read later technical vocabulary into the verse. The fruit list in [Galatians 5:22–25](https://bible.usccb.org/bible/galatians/5) is distinguished from the traditional Latin twelve-fruit enumeration.
- **Church teaching:** precise Catechism paragraphs and council sections establish the formulation being recorded. A source labeled `church_teaching` is not sufficient by itself to assign `defined_doctrine`; that stronger assessment requires a relevant defining text and scholarly justification.

`witness_kind` identifies the cited document's family, not the historical origin of an idea. `date_note`, where supplied, dates that witness or gives a qualified period. No current record claims the earliest occurrence of a concept. Claims about earliest attestation, authorship disputes, textual variants, or doctrinal development require further historical scholarship before being added.

## Initial coverage

The first set contains **36 support records covering 22 concepts and 7 relations**, with ten additional source records. Topics include knowledge of God, the Trinity and incarnation, baptism and resurrection, body and soul, powers, fruits of the Spirit, prayer, spiritual struggle, and revelation. All assessments remain drafts pending scholarly review. Other concepts and relations retain their existing citations and remain unassessed under this new classification.

The canonical files are:

- [`dip/schemas/support_record.dipl`](../dip/schemas/support_record.dipl): the assessment schema.
- [`dip/support_records.dip`](../dip/support_records.dip): claims, qualifications, and `?rationale` metadata.
- [`dip/grounding_sources.dip`](../dip/grounding_sources.dip): added primary passages and structured biblical references.
- [`dip/schemas/ontological_source.dipl`](../dip/schemas/ontological_source.dipl): source family, translation, optional dating, and biblical locator fields. Existing source files supply their own witness categories.

## Adding an assessment

1. Read the full primary argument or biblical context, and check the appropriate Church text where doctrine is involved. Use scholarly editions and studies for disputed readings.
2. State a bounded `claim`, with an exact `target_kind` and existing `target_id`. Avoid classifying everything implied by a broad concept label.
3. Cite a passage in `source_id`; put the reason it supports the assessment in that field's `?rationale`. Explain its scope and limitations in `qualification`.
4. Select the grounding and support kind. A philosophical argument within the Summa is not automatically classified as revealed; a biblical occurrence of a word is not automatically evidence for a later technical definition.
5. Leave doctrinal standing unassessed unless the relevant source supports the proposed status. Supply `status_source_id` when assigning a status.
6. Validate and seek scholarly review. Set `reviewed` only after that review has actually occurred.

Scalar categories use DIPL `!options` and `!labels`. The installed SNT checks `!options` against a whole array rather than each element, so the multi-valued `grounding` field uses a typed string array with element validation in the shared graph validator. As with existing edges, `source_id str` is declared on each record: the installed SNT replaces its local rationale metadata when the field is supplied by the schema. The loaders and validators require that field and its rationale. Validators reject unknown references, missing rationale, invalid or duplicate modes, unassessed mixed with assessed modes, invalid biblical ranges, and unsupported status references.

## Reading and filtering

Under **Explore → Grounding and historical sources**, combine grounding, witness, and support-kind filters. A combined match must come from one support record. Existing primary citations can supply a witness-family match even when their grounding has not yet been assessed.

Concept and relation assessments are independent. Matching relations retain their endpoints for context; that does not transfer the relation's assessment to those concepts. Other study and relation filters continue to apply. Guided tours retain their authored scenes, and exiting a tour restores exploration.

The concept panel has accordions for Definition, Grounding and sources, Study areas, Relations using this principle (where applicable), and Connected relations. Relation rows expand to show their citations, qualifications, conditions, and any additional grounding records. Connection summaries expose the same evidence for their exact edges.

The Python viewer and static Astro site use the same DIPL data and shared validator. Select a concept and open **Grounding and sources**, or expand a connected relation to inspect its own assessment. Run `./setup.sh --check` for build and integrity checks.

Validation checks structure and provenance; it does not certify a theological interpretation.
