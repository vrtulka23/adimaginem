# Passions: objects and interrelations

The passion ontology follows Aquinas's distinction of eleven sensitive passions in [ST I–II, q. 23, a. 4](https://www.newadvent.org/summa/2023.htm#article4). These are movements of appetitive powers. A causal relationship between two passions does not make them the same passion: Aquinas explicitly makes this distinction in [q. 26, a. 1, ad 2](https://www.newadvent.org/summa/2026.htm#article1).

## Canonical records

- [Concepts](../dip/passion_concepts.dip): definitions, Latin names, and stable concept IDs.
- [Profiles](../dip/passion_profiles.dip): structured distinctions about objects and their apprehended attainability.
- [Edges](../dip/passion_edges.dip): appetite membership, qualified objects, opposition, natural ordering, and conditional influence.
- [Sources](../dip/passion_sources.dip): passage references used by those records.

The original eleven concept IDs and their appetite-membership edge IDs are preserved. Definitions and memberships formerly in `concepts.dip` and `edges.dip` now have one declaration in the passion module. Profiles remain editorial classifications; edges retain individual citations, rationales, and review status.

## Distinctions preserved

| Passion | Latin | Specifying aspect |
|---|---|---|
| Love | *amor* | Initial affinity for apprehended suitable good |
| Hatred | *odium* | Repugnance toward apprehended evil |
| Desire | *desiderium* | Movement toward good not yet possessed |
| Aversion | *fuga* | Withdrawal from evil not yet present |
| Delight / joy | *delectatio* | Sensitive repose in attained good |
| Sorrow | *tristitia* | Response to present evil |
| Hope | *spes* | Future arduous good apprehended as attainable |
| Despair | *desperatio* | Withdrawal from arduous good apprehended as unattainable |
| Fear | *timor* | Threatening future evil difficult to avoid |
| Daring | *audacia* | Confronting threatening evil in hope of victory |
| Anger | *ira* | Injury as evil, with vengeance desired as an apparent just good |

The classification is grounded in [I–II23.4](https://www.newadvent.org/summa/2023.htm#article4), with further distinctions in [I–II40.1,4](https://www.newadvent.org/summa/2040.htm), [I–II42.3](https://www.newadvent.org/summa/2042.htm#article3), [I–II45.1–2](https://www.newadvent.org/summa/2045.htm), and [I–II46.1–2](https://www.newadvent.org/summa/2046.htm).

`joy_passion` remains the historical ID of the sensitive delight slot. Its Latin name is corrected to **delectatio** and its display label to **Delight / joy as passion**. Aquinas distinguishes the broader delight from *gaudium*, which follows reason ([I–II31.1,3](https://www.newadvent.org/summa/2031.htm)). This record does not stand for every intellectual joy or for `joy_fruit`.

Hatred does not require a personal wrongdoer or an accomplished loss: its object is apprehended as unsuitable ([I–II29.1](https://www.newadvent.org/summa/2029.htm#article1)). Anger has a complex object, so its profile now uses `good_and_evil` and `experienced_harm_and_future_redress`, rather than treating present evil as its complete account ([I–II46.2](https://www.newadvent.org/summa/2046.htm#article2)). Its two formal-object edges identify the respective aspects of that one passion.

## Reading the graph

| Predicate | Meaning | Example |
|---|---|---|
| `is_passion_of` | Membership in a sensitive appetitive power | Fear belongs to irascible appetite |
| `has_formal_object` | Object **under the aspect specified in the edge conditions** | Hope concerns good as future, arduous, and attainable |
| `is_opposed_to` | Contrariety in the cited respect | Hope and despair differ by approach and withdrawal |
| `precedes_in_generation` | Natural order in generation or execution | Love precedes desire |
| `can_give_rise_to` | Conditional dependence or development | Love disposes toward fear of a threat to the loved good |

The shared `apprehended_good` and `apprehended_evil` nodes express general object aspects. They do not assert that will and sensitive appetite have identical formal objects. The specifying conditions on each passion edge are essential; they preserve distinctions without creating a new entity for every combination of attributes.

The five principal contrary pairs are recorded, together with hope–fear opposition **by good and evil as objects** ([I–II40.4, ad 1](https://www.newadvent.org/summa/2040.htm#article4)). This latter opposition differs from hope–despair opposition by approach and withdrawal. Anger receives no invented contrary passion ([I–II23.3](https://www.newadvent.org/summa/2023.htm#article3)). An opposition edge is stored once: the viewer's arrow indicates stored subject/object order, not causal direction or an asymmetric philosophical opposition.

Generation is not a fixed timeline. Love → desire → delight describes the order of execution; enjoyment can be prior as an intended end ([I–II25.2](https://www.newadvent.org/summa/2025.htm#article2)). Conditional edges preserve further distinctions:

- Love grounds hatred of what opposes the loved good; the two objects or aspects differ ([I–II29.2](https://www.newadvent.org/summa/2029.htm#article2)).
- Love disposes toward fear, without efficiently causing the external threat ([I–II43.1](https://www.newadvent.org/summa/2043.htm#article1)).
- Feared evil becoming present occasions sorrow; sorrow can contribute to anger when injury and hoped-for redress are involved ([I–II25.1](https://www.newadvent.org/summa/2025.htm#article1), [I–II46.1–2](https://www.newadvent.org/summa/2046.htm)).
- Persistent anger can cause hatred without becoming identical to it ([I–II46.3, ad 2](https://www.newadvent.org/summa/2046.htm#article3)).

## Theological and computational boundaries

Sensitive love, theological charity, and divine love retain their distinct concepts. Sensitive hope remains distinct from the theological virtue. The fruit of joy and the gift of fear of the Lord are not merged into passion nodes. Their existing theological definitions and citations govern their meanings.

This is consonant with the Catechism's account of passions and their interrelations ([CCC1763–1766](https://www.vatican.va/content/catechism/en/part_three/section_one/chapter_one/article_5/i_passions.html)). Moral qualification depends on their relationship to reason and will; a passion name or intensity alone does not determine virtue, sin, or holiness ([CCC1767–1770](https://www.vatican.va/content/catechism/en/part_three/section_one/chapter_one/article_5/ii_passions_and_moral_life.html)). These Church references provide doctrinal context; the detailed edge claims cite Aquinas's own arguments.

`attainability` records an apprehension, not an objective probability. `arduous = false` means difficulty does not specify that passion, not that a concrete situation is easy. `initial_affinity` is the existing profile phase for initial affinity **or repugnance**, not approval of an evil object. Profiles and conditional edges are not executable transition laws, and a graph path does not establish a composite causal claim. Conditions are currently cited prose; a future simulator must give any executable interpretation its own reviewed specification.

Both viewer modes read the same DIPL module. Restart the Python viewer after changing it; rebuild the static bundle for the web mode. See [running the explorer](../tools/README.md).
