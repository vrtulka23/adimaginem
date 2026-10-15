# Editorial review and contributions

Ad Imaginem uses machine-learning tools to help discover relevant texts and passages, collect citations, and draft explanations of concepts and their relationships. This includes the prose prepared for guided tours. During browsing, the website displays the explanations stored in the repository; it does not ask an AI service to invent an answer.

The authority belongs to the cited sources. Finding a passage with machine assistance does not guarantee that its context, translation, doctrinal standing, or philosophical meaning has been represented correctly. Our explanations and graph structures remain open to correction under the project's [scholarly and Catholic method](method.md). Participation by a reviewer does not by itself imply institutional endorsement or ecclesiastical approval.

## Found something that needs correction?

We welcome contributions from theologians, philosophers, historians, textual scholars, other subject experts, and responsible Church authorities. In particular, help identifying inconsistencies with Catholic doctrinal teaching or failures of philosophical coherence is welcome.

You do not need to edit code to help. [Open an issue in the repository](https://github.com/vrtulka23/adimaginem/issues), or submit a proposed correction through a pull request. Please include:

1. The concept, relation, or tour scene concerned, with its ID if available.
2. The wording or connection that needs attention and why it is problematic.
3. A precise supporting passage: author, work, article or paragraph, and edition or translation where relevant.
4. Suggested replacement wording and any qualifications or alternative scholarly readings that should remain visible.

Distinguish a claim about Aquinas's own position from a claim about Catholic doctrine or a choice made for the diagram. A layout issue, a mistranslation, and a doctrinal error need different kinds of correction.

## How a correction reaches the website

The editable source of the graph is the [`dip/` directory](../dip/). Its DIPL files hold concepts, relations, citations, interpretive rationales, guided tours, and display settings. Changes can be made there without rewriting the viewer.

For contributors working with a local copy:

1. Locate the affected record in `dip/` using its ID or wording. Tours are in [`dip/tours/`](../dip/tours/); their catalogue and scene files point to the shared ontology records.
2. Correct the record and its supporting citations together. Preserve stable IDs when the concept or claim remains the same, and document substantive changes in the pull request. Set review status only when the appropriate review has actually taken place.
3. Run `./setup.sh --check` to rebuild the data and website and run the structural checks. These checks detect data problems; doctrinal and philosophical review requires competent human judgment.
4. Review the result locally with `./setup.sh --preview`. For the standalone graph, restart `./setup.sh --python` after editing the data.

Changed DIPL inputs invalidate the persisted cache automatically. `./setup.sh --diph5` can force a fresh snapshot, but publishing a correction requires rebuilding the website too. Once a correction reaches `main`, the configured GitHub Pages workflow rebuilds and publishes it. See [running and publishing](running.md) for prerequisites and setup.

The aim is a traceable, revisable atlas: readers should be able to follow each claim back to a source and help improve the interpretation where needed.
