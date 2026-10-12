# Resources for a computational model of Thomistic psychology

This project studies human beings, their powers, and their acts through the psychology and ontology of Thomas Aquinas. Aquinas's writings are the **authoritative texts for claims about his position**. Aristotle supplies essential background, but Aquinas's reading of Aristotle must be cited separately from Aristotle's own text. A software model is an interpretation of these works, not a claim that Aquinas described an algorithm.

Read this corpus with the [scholarly and Catholic method](method.md) in mind. See the [documentation index](index.md) for the other project guides.

## Core primary texts

| Text and online edition | Questions for the model |
| --- | --- |
| Thomas Aquinas, [*Summa theologiae*](https://www.newadvent.org/summa/) | The main cross-reference. [I, qq. 75–76](https://www.newadvent.org/summa/1075.htm) treat the soul and its union with the body; [I, qq. 77–83](https://www.newadvent.org/summa/1077.htm) its powers, intellect, appetite, will, and free choice; [I, qq. 84–89](https://www.newadvent.org/summa/1084.htm) human knowing. [I–II, qq. 1–21](https://www.newadvent.org/summa/2001.htm) cover ends and human acts; [I–II, qq. 22–48](https://www.newadvent.org/summa/2022.htm) the passions; [I–II, qq. 49–70](https://www.newadvent.org/summa/2049.htm) habits and virtues. |
| Thomas Aquinas, [*Commentary on Aristotle's De anima*](https://isidore.co/aquinas/english/DeAnima.htm) | Soul as the principle of life; sensation, imagination, and intellect. Cite by book and lecture (*lectio*), distinguishing Aquinas's commentary from the Aristotle passage he comments on. |
| Thomas Aquinas, [*Quaestiones disputatae de veritate*](https://isidore.co/aquinas/english/QDdeVer10.htm) | Especially [q. 10, “The Mind”](https://isidore.co/aquinas/english/QDdeVer10.htm), [q. 22, “The Tendency to Good and the Will”](https://isidore.co/aquinas/english/QDdeVer22.htm), and [q. 24, “Free Choice”](https://isidore.co/aquinas/english/QDdeVer24.htm). These sharpen distinctions among the soul's essence, powers, knowledge, appetite, and choice. [Q. 19](https://isidore.co/aquinas/english/QDdeVer19.htm) is relevant if the model addresses the separated soul. |
| Thomas Aquinas, [*Quaestiones disputatae de anima*](https://isidore.co/aquinas/english/QDdeAnima.htm) | Articles 1–13 address the soul as form, the unity of the human being, intellect, and the distinction of powers. Articles 14–20 address survival and cognition after death. This is a **different work** from the commentary on Aristotle's *De anima*. |
| Thomas Aquinas, [*Summa contra gentiles*, book II](https://isidore.co/aquinas/english/ContraGentiles2.htm) | Extended arguments concerning the human soul, embodiment, intellect, and individuation. Cite by book and chapter. |
| Thomas Aquinas, [*De ente et essentia*](https://isidore.co/aquinas/english/DeEnte%26Essentia.htm) | Foundations for being, essence, form, matter, genus, and species: useful when defining the model's ontology. Cite by chapter or numbered paragraph in the linked edition. |
| Thomas Aquinas, [*De principiis naturae*](https://www.jonhaines.com/thomas/english/DePrincNaturae.htm) | Matter, form, privation, potency, act, and the four causes. The linked English edition is translated by R. A. Kocourek and numbers its sections; cite those section numbers. |
| Thomas Aquinas, [*De unitate intellectus contra Averroistas*](https://isidore.co/aquinas/english/DeUnitateIntellectus.htm) | Clarifies why individual human beings each have their own intellect, a constraint on any model of persons. |
| Thomas Aquinas, [*Commentary on the Nicomachean Ethics*](https://isidore.co/aquinas/english/Ethics.htm) | Ends, action, deliberation, character, and virtue. Cite by book and lecture, alongside the relevant passage of Aristotle. |
| Thomas Aquinas, [*Summa theologiae* III, qq. 60–65](https://www.newadvent.org/summa/4060.htm) | Sacramental signs, causality, character, and the seven sacraments; read alongside the Church's doctrinal presentation. |
| [*Catechism of the Catholic Church*](https://www.vatican.va/content/catechism/en.html) | The doctrinal authority for the project's claims about the Trinity, grace, virtues, gifts, fruits, and sacraments. Cite paragraph numbers, and distinguish these claims from Aquinas's arguments. |
| [*Catechism of the Catholic Church* §§279–354](https://www.vatican.va/content/catechism/en/part_one/section_two/chapter_one/article_1/paragraph_4_the_creator.index.html) | Creation by the Trinity, spiritual and corporeal creatures, angels, and the goodness and order of the visible world. See the [creation graph](creation.md). |
| Thomas Aquinas, [*Summa theologiae* I, q. 3](https://www.newadvent.org/summa/1003.htm) and [I, qq. 44–50](https://www.newadvent.org/summa/1045.htm) | Divine simplicity and pure act, God as cause of being, creation, and angelic nature. Cite individual question and article for each claim. |

## Foundational background

- Aristotle, [*On the Soul* (*De anima*)](https://classics.mit.edu/Aristotle/soul.html): the account of soul and living powers to which Aquinas responds. Cite by book, chapter, and Bekker number where possible.
- Aristotle, [*Nicomachean Ethics*](https://classics.mit.edu/Aristotle/nicomachaen.html): background for ends, voluntary action, deliberation, and virtue. Cite by book, chapter, and Bekker number where possible.

## Starting conceptual map

The first model should distinguish a **human being** from the **soul**, the soul's **powers**, their **acts**, their **objects**, and acquired **habits**. Aquinas argues that the intellectual principle is the form of the human body (*ST* I, q. 76, a. 1): “the intellect which is the principle of intellectual operation is the form of the human body.” [Read the article and its objections and replies](https://www.newadvent.org/summa/1076.htm). He identifies five genera of powers—vegetative, sensitive, appetitive, locomotive, and intellectual—at [*ST* I, q. 78, a. 1](https://www.newadvent.org/summa/1078.htm). These passages are starting constraints on the ontology, rather than a ready-made software architecture.

For behavior, trace how perception, imagination, appetite, practical reasoning, will, and choice relate. Read [*ST* I, qq. 78–83](https://www.newadvent.org/summa/1078.htm), [*De veritate* q. 10](https://isidore.co/aquinas/english/QDdeVer10.htm), [q. 22](https://isidore.co/aquinas/english/QDdeVer22.htm), and [q. 24](https://isidore.co/aquinas/english/QDdeVer24.htm) before fixing causal rules. Passions, habits, and virtues add state and development to this account ([*ST* I–II, qq. 22–70](https://www.newadvent.org/summa/2022.htm)).

## Citation and reuse practice

For every substantive rule or entity in the model, record (1) a precise passage reference, (2) a short quotation where its wording matters, (3) the model's interpretation of that passage, and (4) unresolved alternatives or objections. In the *Summa*, cite part, question, article, and section (*objection*, *sed contra*, *respondeo*, or reply). An objection alone is **not** Aquinas's settled position. For disputed questions, cite question and article; for commentaries, book and lecture. Link to the edition used and name its translator when quoting English.

These editions are freely readable online. **Online access does not by itself grant an open-source license to the English translations.** In particular, the linked *De anima* commentary identifies a 1951 translation and *De anima* disputed questions a 1949 translation. Keep quotations brief with attribution, and check rights before copying full translations into this repository or a dataset. The project should publish its own code and original explanations under the repository's license while maintaining citations to the source texts.
