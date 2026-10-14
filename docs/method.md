# Scholarly and Catholic method

The model aims to be philosophically precise, textually grounded, and consonant with Catholic teaching. Its computational structures are explicit interpretations of a tradition; they are not substitutes for the human person, the spiritual soul, or theological judgment.

## Interpretive authorities

1. **Aquinas's own texts** govern claims about Aquinas. Read the whole article or argument, including objections and replies, and compare parallel passages where a term or conclusion is disputed. The [source guide](resources.md) identifies the starting corpus.
2. **Catholic teaching** governs claims presented as Catholic doctrine. Check the relevant magisterial text, especially the [*Catechism of the Catholic Church*](https://www.vatican.va/content/catechism/en.html), and cite its paragraph numbers. The Catechism affirms the unity of the embodied person and calls the soul the form of the body ([§§362–368](https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_one/article_1/paragraph_6_man.html)); it also treats [human freedom, §§1730–1748](https://www.vatican.va/content/catechism/en/part_three/section_one/chapter_one/article_3.html), and [the passions, §§1762–1775](https://www.vatican.va/content/catechism/en/part_three/section_one/chapter_one/article_5.html). John Paul II presents Aquinas as a model of dialogue between faith and reason in [*Fides et ratio*, §§43–44](https://www.vatican.va/content/john-paul-ii/en/encyclicals/documents/hf_jp-ii_enc_14091998_fides-et-ratio.html).
3. **Scholarly studies and critical editions** help establish translation, context, textual variants, and competing interpretations. Cite them by author and publication details, and identify when an interpretation is contested. They do not replace the primary passage or magisterial source.

Do not label every Thomistic thesis as defined Catholic doctrine. State whether a claim is Aquinas's argument, a teaching of the Church, a scholarly interpretation, or a modeling choice. Where these levels interact, explain the relationship and identify any unresolved tension before encoding a rule.

## Review standard for model claims

Each significant concept, constraint, or transition in the Rust model should have a traceable record containing:

- a precise primary passage and, when doctrine is implicated, a precise Catholic teaching reference;
- the relevant wording and translation or edition used, with the argument's context;
- the proposed interpretation, serious alternative readings, and the reason for choosing it;
- the computational representation and what it deliberately abstracts from;
- a review status so provisional readings are not presented as settled conclusions.

The review must check distinctions essential to the sources: person and soul, essence and power, power and act, intellect and will, sensitive and intellectual appetite, and voluntary action and passion. In particular, the Catechism describes the person as a unity of body and soul ([§365](https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_one/article_1/paragraph_6_man.html)) and freedom as rooted in reason and will ([§1731](https://www.vatican.va/content/catechism/en/part_three/section_one/chapter_one/article_3/i_freedom_and_responsibility.html)). A convenient software decomposition must not be asserted as a metaphysical separation. Likewise, numerical state or decision rules must not be presented as a complete account of free choice, moral responsibility, grace, or the spiritual soul.

When a source is ambiguous, keep the model's assumption visible and revisable. Scholarly disagreement should be documented with citations rather than resolved by implementation convenience. See the [documentation index](index.md) for the other guides.

## Source authority in DIPL

`authority_kind` distinguishes `scripture`, `philosophical_text`, `thomistic_text`, `church_teaching`, `church_guidance` (official pastoral explanations or ecclesiastical discipline), and `pastoral_literature` (non-magisterial terminology or commentary). These are source types, not numerical levels of certainty. A curial presentation is not thereby a dogmatic definition, and a professional Catholic association's terminology is not universal Church teaching. Each citation's author, work, locator, and the record's qualifications govern its use. See [spiritual warfare](spiritual-warfare.md) for the first use of the latter two categories.

## Claim-level grounding

The [grounding and historical sources](grounding-and-sources.md) records implement these distinctions for particular cited claims. Source family, mode of knowledge, kind of support, doctrinal standing, and editorial review remain separate. New assessments use primary texts and official Church documents with identified editions or translations; disputed readings require critical editions and scholarly studies. An unassessed claim is not thereby unsupported, and a dated witness is not necessarily the first occurrence of an idea.
