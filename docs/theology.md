# Theological ontology in DIPL

See the dedicated [Holy Trinity](trinity.md) page for the expanded account of Word and Love, relations of origin, divine unity, and the focused graph view.

The theological records in [`dip/theology_sources.dip`](../dip/theology_sources.dip), [`theology_concepts.dip`](../dip/theology_concepts.dip), and [`theology_edges.dip`](../dip/theology_edges.dip) extend the [human ontology](ontology.md). Specific effects and recipient distinctions are in [`sanctification_sources.dip`](../dip/sanctification_sources.dip), [`sanctification_concepts.dip`](../dip/sanctification_concepts.dip), and [`sanctification_edges.dip`](../dip/sanctification_edges.dip). They are a cited, provisional knowledge base for Christian anthropology. They are not numerical controls for divine action or a simulation of God.

## Authority and scope

The [sin and angelic ministry modules](sin-and-angels.md) add moral disorders and their effects on human powers, conversion, angelic influence and its limits, and the nine angelic orders with their characteristic ministries.

Every source has an `authority_kind`: `church_teaching` for passages of the *Catechism of the Catholic Church*, and `thomistic_text` for Aquinas's own arguments. A Catechism passage supports a claim about Catholic teaching; an Aquinas passage supports a claim about his account. The two kinds of authority must remain distinguishable in model output. Concepts and edges begin with `review_status = "draft"`; a source citation and rationale do not replace theological review.

The Trinity is encoded as the one divine essence and three really distinct divine persons, following [Catechism §§253–254](https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_one/article_1/paragraph_2_the_father.index.html). `is_person_of` does not mean a person is a part of God. Relations of origin are also represented: the Father begets the Son, and the Holy Spirit proceeds from the Father and the Son as one principle, following [Catechism §246](https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_one/article_1/paragraph_2_the_father.index.html). These are doctrinal claims, not a simulated internal divine mechanism.

## Human and supernatural distinctions

The graph distinguishes acquired and infused virtue, cardinal and theological virtue, sanctifying and actual grace, the seven gifts, and the twelve fruits. These are not interchangeable classifications. A cardinal virtue may be considered in acquired or infused form; the cardinal class is therefore not placed under `acquired_virtue`. Aquinas distinguishes acquired from infused virtues in [*ST* I–II, q. 63](https://www.newadvent.org/summa/2063.htm), while the [Catechism §§1812–1813](https://www.vatican.va/content/catechism/en/part_three/section_one/chapter_one/article_7/ii_the_theological_virtues.index.html) names faith, hope, and charity as theological virtues.

Theological hope, the sensitive passion of hope, the gift of fortitude, the virtue of fortitude, charity as virtue, and charity as fruit have distinct stable IDs. The [Catechism §§1830–1832](https://www.vatican.va/content/catechism/en/part_three/section_one/chapter_one/article_7/iii_the_gifts_and_fruits_of_the_holy_spirit.html) distinguishes gifts from fruits; Aquinas discusses fruits as acts in [*ST* I–II, q. 70, a. 1](https://www.newadvent.org/summa/2070.htm). The fruit names use normalized Latin expressions based on the [Latin Catechism §1832](https://www.vatican.va/archive/catechism_lt/p3s1c1a7_lt.htm). The stable ID `generosity_fruit` retains the English Catechism designation; its displayed label is now **Longanimity / generosity (fruit)** to make the Latin *longanimitas* explicit.

The four cardinal virtues are connected to their proper powers in [*ST* I–II, q. 61, a. 2](https://www.newadvent.org/summa/2061.htm): prudence to reason, justice to will, fortitude to irascible appetite, and temperance to concupiscible appetite. Each of the twelve listed fruits is also linked to the Holy Spirit as its source, following Catechism §1832. The repeated edges apply that general teaching to each named fruit.

`sanctifying_grace` connects to `rational_soul` because Aquinas places habitual grace in the soul's essence and distinguishes it from virtues perfecting powers ([*ST* I–II, q. 110, aa. 3–4](https://www.newadvent.org/summa/2110.htm)). The [Catechism §2000](https://www.vatican.va/content/catechism/en/part_three/section_one/chapter_three/article_2/ii_grace.html) distinguishes habitual grace from actual graces. This ontology does not claim to observe a person's state of grace.

## Theological virtues and human faculties

The graph connects each theological virtue to its human faculty through `inheres_in_subject`:

| Virtue | Faculty | Aquinas's account |
| --- | --- | --- |
| Faith (*fides*) | Intellect | Assent to revealed truth, moved by the will; [*ST* II–II, q. 4, a. 2](https://www.newadvent.org/summa/3004.htm#article2). |
| Hope (*spes*) | Will | Desire for divine good in the intellectual appetite; distinct from sensitive hope; [*ST* II–II, q. 18, a. 1](https://www.newadvent.org/summa/3018.htm#article1). |
| Charity (*caritas*) | Will | Love of divine good belongs to the intellectual appetite; [*ST* II–II, q. 24, a. 1](https://www.newadvent.org/summa/3024.htm#article1). |

The [Catechism §§1812–1813](https://www.vatican.va/content/catechism/en/part_three/section_one/chapter_one/article_7/ii_the_theological_virtues.html) teaches that these virtues prepare human faculties for participation in divine life and ground Christian moral activity. The faculty links identify the subject of each habit; they do not assert that every human possesses infused virtue or that a habit automatically produces an act. The existing charity link and its distinct act remain in `sanctification_edges.dip`, alongside the faith and hope links.

## Fruits as human operations

[`fruit_sources.dip`](../dip/fruit_sources.dip), [`fruit_concepts.dip`](../dip/fruit_concepts.dip), and [`fruit_edges.dip`](../dip/fruit_edges.dip) connect all twelve fruits to human operations, states, or powers. The central authority is [*ST* I–II, q. 70, aa. 1, 3](https://www.newadvent.org/summa/2070.htm): fruit names can denote virtuous operations under the Holy Spirit's movement. The graph therefore preserves separate nodes for a habitual virtue and its fruitful exercise. The added human scope does not assert that every fruit applies identically to angels.

For example, goodness connects through benevolence to will; kindness connects to beneficence. These acts have their own definitions in [II–II, q. 27, a. 2](https://www.newadvent.org/summa/3027.htm#article2) and [q. 31, a. 1](https://www.newadvent.org/summa/3031.htm#article1). Peace includes both concord among persons and harmony within their appetitive movements, following [q. 29, aa. 1, 3](https://www.newadvent.org/summa/3029.htm#article1). Spiritual joy follows charity while remaining compatible with sorrow concerning obstacles to participation in divine goodness ([q. 28, aa. 1–2](https://www.newadvent.org/summa/3028.htm#article1)).

Longanimity concerns persistence toward delayed good ([II–II, q. 136, a. 5](https://www.newadvent.org/summa/3136.htm#article5)); its edge uses that sense of the existing fruit ID. The self-control edges distinguish resistance by the will from moderation of sensitive desire: strong contrary desires may remain in the continent person ([q. 155, a. 3](https://www.newadvent.org/summa/3155.htm#article3)). The chastity edge explicitly restricts its object to sexual desire, following the proper sense in [q. 151, aa. 1–2](https://www.newadvent.org/summa/3151.htm#article1).

Each connection has a citation and `?rationale`. Conditions record restricted meanings; interpretive mappings are marked as such. The new act and state names are normalized vocabulary. Relations such as `expresses`, `includes`, and `resists` describe different kinds of connection; they do not supply numerical transition rules. All records remain drafts for scholarly review.

## Sacraments

The seven sacrament types and their three pastoral groups follow [Catechism §§1210–1211](https://www.vatican.va/content/catechism/en/part_two/section_two.index.html). Baptism, Confirmation, and Holy Orders connect to `sacramental_character`, following [Catechism §698](https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_three/article_8/ii_the_name%2C_titles%2C_and_symbols_of_the_holy_spirit.html). Aquinas treats sacraments of the New Law as instrumental causes of grace, with God as principal cause ([*ST* III, q. 62, a. 1](https://www.newadvent.org/summa/4062.htm)). The graph now includes representative effects of all seven sacraments, with human recipient scope. It does not yet specify a complete account of sacramental validity, ministers, signs, or concrete celebrations.

The effect relations follow Aquinas's overview of spiritual life in [*ST* III, q. 65, a. 1](https://www.newadvent.org/summa/4065.htm#article1). Eucharistic increase of charity and its exercise are distinguished ([III, q. 79, a. 1, ad 1–2](https://www.newadvent.org/summa/4079.htm#article1)). Sacramental character connects to intellectual power and Christ's priesthood ([III, q. 63, aa. 3–5](https://www.newadvent.org/summa/4063.htm#article3)). Bodily healing through anointing carries the explicit condition concerning salvation in [Catechism §1532](https://www.vatican.va/content/catechism/en/part_two/section_two/chapter_two/article_5/in_brief.html).

The [Catechism §§1127–1129](https://www.vatican.va/content/catechism/en/part_two/section_one/chapter_one/article_2/iv_the_sacraments_of_salvation.html) distinguishes sacramental efficacy from the disposition relevant to its fruits. Later modeling should treat a sacrament type, a concrete celebration, and a recipient's disposition as different things; it should not infer the efficacy of grace from a numerical score.

## Computational use

### Gifts and angelic recipients

The seven broad gift-to-faculty edges cite [*ST* I–II, q. 68, a. 4](https://www.newadvent.org/summa/2068.htm#article4). More specific links distinguish speculative and practical intellect; these name the same faculty by different ends ([I, q. 79, a. 11](https://www.newadvent.org/summa/1079.htm#article11)). Counsel perfects prudence ([II–II, q. 52, a. 2](https://www.newadvent.org/summa/3052.htm#article2)); charity grounds wisdom's connatural judgment ([II–II, q. 45, a. 2](https://www.newadvent.org/summa/3045.htm#article2)). These mappings do not exhaust each gift's scope.

Angelic intellect and will have separate nodes because the existing human faculty hierarchy describes powers of an embodied soul. Angels' faculties follow [I, q. 54, aa. 3–4](https://www.newadvent.org/summa/1054.htm#article3) and [I, q. 59, aa. 1, 4](https://www.newadvent.org/summa/1059.htm#article1). Grace enables supernatural turning toward God ([I, q. 62, a. 2](https://www.newadvent.org/summa/1062.htm#article2)). Counsel directs blessed angelic ministry in the mode explained in [II–II, q. 52, a. 3](https://www.newadvent.org/summa/3052.htm#article3). Their communion with Christ through charity and vision is distinguished from Eucharistic reception ([III, q. 80, a. 2](https://www.newadvent.org/summa/4080.htm#article2)). `blessed_angel` records a condition, excluding fallen angels from these claims.

### Qualified edges

The shared edge schema adds `recipient_scope`, `affected_aspect`, and `causal_mode`, each with DIPL options and labels. `unspecified` preserves the lack of an explicit qualifier on older edges; it does not mean universally applicable. `conditions` and `condition_source_id` default to DIPL `none` and must be supplied together when used. Rust validates the condition citation and returns its full source record in cited queries. The browser displays the qualifiers, condition, and citation in the connected-relation details.

Conditions are descriptive source-backed restrictions. The loader does not evaluate them as predicates or determine the spiritual state of an individual. A graph path is a navigational connection, not a proof that all of its edges share recipients or compose into a causal rule. Latin names of newly modeled effects are normalized vocabulary, not verbatim quotations. All additions remain `draft`; interpretive mappings are explicitly marked.

These DIPL records provide a **structural base**: the Rust core can validate references and answer cited questions about categories and relations. A dynamic model still needs separately cited acts, conditions, and transitions. `included_in_model` only selects graph edges for a query; it grants no authority to turn doctrine on or off in a scenario. See the [architecture](architecture.md) and [scholarly method](method.md).
