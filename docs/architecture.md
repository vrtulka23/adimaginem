# Architecture

## Language boundaries

- **Rust** owns the computational core: ontology representations, state transitions, simulation rules, and performance-sensitive algorithms. The core should expose a stable interface for Python rather than depend on Python for its semantics.
- **Python** supplies the outer binding and, where useful, orchestration: loading scenarios, invoking the Rust core, running studies, and presenting results. The first binding is the [`adimaginem.py`](../adimaginem.py) process interface: Python asks SNT to evaluate DIPL, adds citation rationale metadata, and sends one JSON request to the Rust executable over standard input. This JSON is an interface format required by the SNT export and the Rust/Python boundary, not a separate parameter store.
- A model rule must retain a precise citation to its source and identify the interpretive step from text to computation. Follow the [scholarly and Catholic method](method.md) and [source guide](resources.md).

The [dependencies and data formats](dependencies.md) page defines how parameters reach these layers. Return to the [documentation index](index.md).

## First executable slice

The Rust core in [`src/`](../src/) loads the evaluated ontology, validates citations and edge endpoints, and answers cited concept and outgoing-edge queries. It rejects an edge if its rationale is missing. Query output includes the passage locator and URL. This is a structural model: `included_in_model` determines which edges appear in outgoing queries, but the core does not infer psychological causes or temporal succession from those relations.

From the repository root, with SNT3 and Rust installed:

```sh
python3 adimaginem.py validate
python3 adimaginem.py concept rational_soul
python3 adimaginem.py outgoing rational_soul --relation has_power_genus
```

SNT3 0.9.4's `--generate json` includes evaluated values but omits metadata such as `?rationale`. Python therefore also calls `snt dip list` and joins rationale metadata to edges by their DIPL paths. If SNT adds a metadata-aware JSON export, the handoff can become one evaluation step. The Rust executable accepts the resulting JSON envelope on standard input and returns JSON on standard output.
