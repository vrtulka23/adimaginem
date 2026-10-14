# Architecture

## Language boundaries

- **Rust** owns the computational core: ontology representations, state transitions, simulation rules, and performance-sensitive algorithms. Rust will link to SNT's C ABI and call the DIPL evaluator in process. Python will bind to the Rust API and may orchestrate studies, but will not sit between DIPL parsing and Rust.
- **SNT3** remains the authority for DIPL parsing and evaluation. The current C ABI is experimental; its path getter formats values as text and it does not expose the `?rationale` metadata needed by this ontology. Extend that ABI with a structured environment export that includes values, schemas, and node metadata, or typed traversal functions with equivalent coverage. Rust should own the resulting data after parsing and validate ontology-specific references and rules.
- **Python** supplies the outer binding and, where useful, orchestration: loading scenarios, invoking the Rust core, running studies, and presenting results. `adimaginem.py` is currently a process interface used to validate the model. It invokes SNT's CLI, gathers metadata, and sends JSON to Rust; keep it as a temporary development path until the linked integration supplies the same cited data.
- A model rule must retain a precise citation to its source and identify the interpretive step from text to computation. Follow the [scholarly and Catholic method](method.md) and [source guide](resources.md).

The [dependencies and data formats](dependencies.md) page defines how parameters reach these layers. Return to the [documentation index](index.md).

## First executable slice

The Rust core in [`src/`](../src/) currently loads evaluated ontology JSON, validates citations, edge endpoints, relation types, and passion profiles, and answers cited concept, outgoing-edge, and passion-profile queries. It rejects an edge or profile if its rationale is missing. Query output includes the passage locator and URL. The next integration step is replacing the subprocess data handoff with an in-process call to SNT's C ABI and adding structured access to metadata and typed values. This is a structural model: `included_in_model` determines which edges appear in outgoing queries, but the core does not infer psychological causes or temporal succession from those relations.

From the repository root, with SNT3 and Rust installed:

```sh
python3 adimaginem.py validate
python3 adimaginem.py concept rational_soul
python3 adimaginem.py outgoing rational_soul --relation has_power_genus
python3 adimaginem.py passion anger_passion
python3 adimaginem.py support god
python3 adimaginem.py support person_has_form --target-kind edge
```

The current `adimaginem.py` path uses SNT3 0.9.4's `--generate json` plus `snt dip list`, because generated values omit metadata such as `?rationale`. It joins rationales to records by DIPL path. The in-process replacement needs to preserve this provenance. A structured export through the C ABI may use JSON as the interchange representation inside the process; that avoids a subprocess and avoids duplicating DIPL evaluation in Rust while keeping the schema and rationale data intact.

Claim-level support records and their `?rationale` metadata travel through both loaders. Rust validates their references, classification values, biblical locators, and status evidence; `support` queries return the exact claim, rationale, qualification, and cited sources. The shared browser module `source_support.mjs` validates and filters the same records without propagating an assessment between concepts and edges. See [grounding and historical sources](grounding-and-sources.md).
