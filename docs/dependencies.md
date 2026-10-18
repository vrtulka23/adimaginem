# Dependencies and data formats

## Building and running

| Use | Requirements |
| --- | --- |
| Published GitHub Pages site | A modern browser with WebGL; internet for visualization libraries and icons |
| Local Astro website or static build | Supported even-numbered Node release (22.12+, 24, or 26), npm, Python 3.9+, native SNT 0.9.6+ CLI |
| Standalone Python graph viewer | Python 3.9+, native SNT 0.9.6+ CLI, browser |

Astro is pinned in `package.json` and `package-lock.json`. `./setup.sh --install` installs its locked dependency tree. The script can select an already installed supported Homebrew Node when the default Node is unsupported; it does not change the system installation.

Install [SNT3](https://github.com/scinumtools/snt3) using its documented installation method. On macOS, `brew tap scinumtools/tap` followed by `brew install scinumtools3` provides the native CLI. Verify `snt --version` reports at least 0.9.6. For an existing Homebrew installation, use `brew update` and `brew upgrade scinumtools3`. The GitHub workflow uses the published SNT 0.9.6 Linux CLI with a pinned SHA-256 checksum. No sibling SNT checkout or browser runtime build is required.

If the package manager still offers an older version, use the appropriate archive
from the [0.9.6 release](https://github.com/scinumtools/snt3/releases/tag/v0.9.6).
Verify its published SHA-256 digest and place the extracted archive's contents
in `build/snt/`, keeping the executable and bundled libraries together.
`./setup.sh` prefers `build/snt/snt` when present and checks the required version.
This optional local installation is ignored by Git. For direct Python or npm
commands, use `PATH="$PWD/build/snt:$PATH"` to select it as well.

[Astro's installation requirements](https://docs.astro.build/en/install-and-setup/) and [GitHub Pages guide](https://docs.astro.build/en/guides/deploy/github/) describe the framework conventions used here.

## SNT3 and DIPL

Canonical `.dip` and `.dipl` files live under [`dip/`](../dip/), with [`dip/DIPfile`](../dip/DIPfile) as the entry point. **Project-owned graph parameters, ontology records, citations, tours, and configurable presentation settings belong in DIPL.** Do not maintain independent graph defaults in JavaScript, Python, or another configuration format.

Use DIPL types, schemas, constraints, units where meaningful, and source provenance. The native loader creates or reads a DIPH5 snapshot. With SNT 0.9.6, a single `json-metadata` export supplies values and effective metadata on values and containers. The versioned `snt-dip-values/2` format declares array shape explicitly, so singleton arrays are reconstructed from their type information. Current DIPL requires 0.9.6+ for schema metadata constraints. Older export adapters remain readable for compatibility with previous data.

The export also exposes declaration/override provenance and source identities. Those describe DIPL declarations; they do not replace scholarly citations. Bibliographic `?authors`, `?title`, and `?url` live directly on each source map item. Its schema requires all three with `!metadata <name> nonempty`. The loader normalizes them to the existing browser citation fields and rejects missing or conflicting information, including when reading a snapshot.

The adapter accepts both `snt-dip-values/1` and `snt-dip-values/2`. The latter's `node_metadata` inventory carries source-map citation metadata. DIPH5 preserves the evaluated metadata but does not rerun schema constraints on load; source/schema changes invalidate this project's cache and trigger fresh evaluation. See [citation authoring](ontology.md#authoring-citation-metadata).

## Conventional files and generated transport

`package.json` and its lockfile are npm conventions; `astro.config.mjs` configures the framework; the GitHub Actions workflow uses YAML as required by that platform. Site URLs, deployment base paths, dependency versions, and service ports use those technologies' conventions. Domain and graph settings remain in DIPL.

The generated `public/graph-assets/ontology.json` is a static browser transport asset produced from DIPL, not an independently edited configuration source. Python serves the same data contract through `/api/ontology`. DIPH5 is the persistent native evaluation cache. Never edit derived assets to change the ontology.

Source quotations and scholarly argument remain in [cited documentation](resources.md); parameter files do not replace the primary texts. See [running and publishing](running.md).
