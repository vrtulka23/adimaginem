# Theological ontology in DIPL

The theological records in [`dip/theology_sources.dip`](../dip/theology_sources.dip), [`theology_concepts.dip`](../dip/theology_concepts.dip), and [`theology_edges.dip`](../dip/theology_edges.dip) extend the [human ontology](ontology.md). They are a cited, provisional knowledge base for Christian anthropology. They are not numerical controls for divine action or a simulation of God.

## Authority and scope

Every source has an `authority_kind`: `church_teaching` for passages of the *Catechism of the Catholic Church*, and `thomistic_text` for Aquinas's own arguments. A Catechism passage supports a claim about Catholic teaching; an Aquinas passage supports a claim about his account. The two kinds of authority must remain distinguishable in model output. Concepts and edges begin with `review_status = "draft"`; a source citation and rationale do not replace theological review.

The Trinity is encoded as the one divine essence and three really distinct divine persons, following [Catechism §§253–254](https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_one/article_1/paragraph_2_the_father.index.html). `is_person_of` does not mean a person is a part of God. The graph records doctrine about the Trinity, not an internal divine mechanism.

## Human and supernatural distinctions

The graph distinguishes acquired and infused virtue, cardinal and theological virtue, sanctifying and actual grace, the seven gifts, and the twelve fruits. These are not interchangeable classifications. A cardinal virtue may be considered in acquired or infused form; the cardinal class is therefore not placed under `acquired_virtue`. Aquinas distinguishes acquired from infused virtues in [*ST* I–II, q. 63](https://www.newadvent.org/summa/2063.htm), while the [Catechism §§1812–1813](https://www.vatican.va/content/catechism/en/part_three/section_one/chapter_one/article_7/ii_the_theological_virtues.index.html) names faith, hope, and charity as theological virtues.

Theological hope, the sensitive passion of hope, the gift of fortitude, the virtue of fortitude, charity as virtue, and charity as fruit have distinct stable IDs. The [Catechism §§1830–1832](https://www.vatican.va/content/catechism/en/part_three/section_one/chapter_one/article_7/iii_the_gifts_and_fruits_of_the_holy_spirit.html) distinguishes gifts from fruits; Aquinas discusses fruits as acts in [*ST* I–II, q. 70, a. 1](https://www.newadvent.org/summa/2070.htm). The fruit names use normalized Latin expressions based on the [Latin Catechism §1832](https://www.vatican.va/archive/catechism_lt/p3s1c1a7_lt.htm); the English labels follow the English Catechism, so `generosity_fruit` corresponds to *longanimitas*.

`sanctifying_grace` connects to `rational_soul` because Aquinas places habitual grace in the soul's essence and distinguishes it from virtues perfecting powers ([*ST* I–II, q. 110, aa. 3–4](https://www.newadvent.org/summa/2110.htm)). The [Catechism §2000](https://www.vatican.va/content/catechism/en/part_three/section_one/chapter_three/article_2/ii_grace.html) distinguishes habitual grace from actual graces. This ontology does not claim to observe a person's state of grace.

## Sacraments

The seven sacrament types and their three pastoral groups follow [Catechism §§1210–1211](https://www.vatican.va/content/catechism/en/part_two/section_two.index.html). Baptism, Confirmation, and Holy Orders connect to `sacramental_character`, following [Catechism §698](https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_three/article_8/ii_the_name%2C_titles%2C_and_symbols_of_the_holy_spirit.html). Aquinas treats sacraments of the New Law as instrumental causes of grace, with God as principal cause ([*ST* III, q. 62, a. 1](https://www.newadvent.org/summa/4062.htm)). The graph has a general `sacramental_grace` concept; it does not yet encode each sacrament's specific sign, effect, minister, recipient, or celebration.

The [Catechism §§1127–1129](https://www.vatican.va/content/catechism/en/part_two/section_one/chapter_one/article_2/iv_the_sacraments_of_salvation.html) distinguishes sacramental efficacy from the disposition relevant to its fruits. Later modeling should treat a sacrament type, a concrete celebration, and a recipient's disposition as different things; it should not infer the efficacy of grace from a numerical score.

## Computational use

These DIPL records provide a **structural base**: the Rust core can validate references and answer cited questions about categories and relations. A dynamic model still needs separately cited acts, conditions, and transitions. `included_in_model` only selects graph edges for a query; it grants no authority to turn doctrine on or off in a scenario. See the [architecture](architecture.md) and [scholarly method](method.md).
