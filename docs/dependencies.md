# Dependencies and data formats

## SNT3 and DIPL

[SNT3](https://github.com/scinumtools/snt3) and its [DIPL language](https://scinumtools.github.io/snt3/dipl/index.html) define the project's parameter system. Store the canonical `.dip` files in the repository's [`dip/` directory](../dip/). **Every project-owned parameter that can be set at runtime or at compile time must have a DIPL definition there.** This includes simulation settings, model constants intended to be configurable, numerical controls, feature choices, and build options owned by this project. Do not create a parallel set of defaults or validation rules in Rust, Python, or another configuration file.

Use DIPL types, constraints, units where meaningful, derived relationships, and provenance. Validate parameter sets with SNT3. The preferred runtime path is for Rust to link to SNT's C ABI, evaluate DIPL in process, and ingest the resulting typed values and metadata. Python remains an outer binding and orchestrator around Rust. At build time, consume evaluated DIPL values through an appropriate build step or generated Rust data. Record effective runtime inputs with results and the effective compile-time values with the build so both can be reproduced. Organize additional `.dip` files under `dip/` as the parameter set grows.

The [`dip/DIPfile`](../dip/DIPfile) is the project entry point. It currently loads the [cited ontology graph](ontology.md), which holds source-backed concepts and relations for ingestion by the future computational model.

The current prototype uses SNT3 0.9.4's JSON generation and metadata inspection commands as a temporary handoff to Rust; see the [executable slice](architecture.md#first-executable-slice). The linked integration will need SNT's C ABI library, available from an SNT source build with its C binding enabled. The C ABI is experimental and currently returns individual values as formatted text; it needs structured, metadata-aware access before it can replace the prototype for this ontology. Rust may use `serde` and `serde_json` to decode an in-process structured export. These are implementation dependencies, not stores for project parameters.

## Other formats

YAML, TOML, or another serialization format may be used only when an external convention or dependency explicitly requires it, such as `Cargo.toml`, `pyproject.toml`, or a CI workflow. Keep those files to the settings the associated technology requires. If a value in one of them is also a project-owned runtime or compile-time parameter, define it in DIPL and derive or synchronize the required external setting from that definition; do not maintain independent values. Source quotations and scholarly argument remain in [cited documentation](resources.md); a parameter file does not replace the primary text.

Return to the [documentation index](index.md).
