# Architecture

## Language boundaries

- **Rust** owns the computational core: ontology representations, state transitions, simulation rules, and performance-sensitive algorithms. The core should expose a stable interface for Python rather than depend on Python for its semantics.
- **Python** supplies the outer binding and, where useful, orchestration: loading scenarios, invoking the Rust core, running studies, and presenting results. The binding mechanism will be chosen when the first executable model is designed.
- A model rule must retain a precise citation to its source and identify the interpretive step from text to computation. Follow the [scholarly and Catholic method](method.md) and [source guide](resources.md).

The [dependencies and data formats](dependencies.md) page defines how parameters reach these layers. Return to the [documentation index](index.md).
