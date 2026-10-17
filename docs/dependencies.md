# Dependencies and data formats

## Building and running

| Use | Requirements |
| --- | --- |
| Published GitHub Pages site | A modern browser with WebGL; internet for visualization libraries and icons |
| Local Astro website or static build | Supported even-numbered Node release (22.12+, 24, or 26), npm, Python 3.9+, native `snt` CLI |
| Standalone Python graph viewer | Python 3.9+, native `snt` CLI, browser |

Astro is pinned in `package.json` and `package-lock.json`. `./setup.sh --install` installs its locked dependency tree. The script can select an already installed supported Homebrew Node when the default Node is unsupported; it does not change the system installation.

Install [SNT3](https://github.com/scinumtools/snt3) using its documented installation method. On macOS, `brew tap scinumtools/tap` followed by `brew install scinumtools3` provides the native CLI. Verify `snt --version`. For an existing Homebrew installation, use `brew update` and `brew upgrade scinumtools3` to get the newer release. The GitHub workflow uses the published SNT 0.9.5 Linux CLI with a pinned SHA-256 checksum. No sibling SNT checkout or browser runtime build is required.

[Astro's installation requirements](https://docs.astro.build/en/install-and-setup/) and [GitHub Pages guide](https://docs.astro.build/en/guides/deploy/github/) describe the framework conventions used here.

## SNT3 and DIPL

Canonical `.dip` and `.dipl` files live under [`dip/`](../dip/), with [`dip/DIPfile`](../dip/DIPfile) as the entry point. **Project-owned graph parameters, ontology records, citations, tours, and configurable presentation settings belong in DIPL.** Do not maintain independent graph defaults in JavaScript, Python, or another configuration format.

Use DIPL types, schemas, constraints, units where meaningful, and source provenance. The native loader creates or reads a DIPH5 snapshot. With the supported SNT 0.9.5 release, a single `json-metadata` export supplies values and effective `?rationale` / `?category` metadata. The versioned `snt-dip-values/1` format declares array shape explicitly, so singleton arrays are reconstructed from their type information. SNT 0.9.4 remains supported through values export, bulk inspection, and normalization of known array fields. The browser receives the same data contract from either path.

The export also exposes declaration/override provenance and source identities. Those describe DIPL declarations; they do not replace scholarly citations. Bibliographic `?authors`, `?title`, and `?url` now live on each source's `locator` value, so the installed and pinned 0.9.5 release can export them in `snt-dip-values/1`. The loader normalizes them to the existing browser citation fields and rejects missing or conflicting information.

The adapter accepts both `snt-dip-values/1` and `snt-dip-values/2`. The latter is available in the newer upstream source build and adds `node_metadata` for containers; source-map citation metadata is supported when supplied through that inventory. Current authored records use the locator placement to keep the released CLI and GitHub workflow compatible. See [citation authoring](ontology.md#authoring-citation-metadata).

## Conventional files and generated transport

`package.json` and its lockfile are npm conventions; `astro.config.mjs` configures the framework; the GitHub Actions workflow uses YAML as required by that platform. Site URLs, deployment base paths, dependency versions, and service ports use those technologies' conventions. Domain and graph settings remain in DIPL.

The generated `public/graph-assets/ontology.json` is a static browser transport asset produced from DIPL, not an independently edited configuration source. Python serves the same data contract through `/api/ontology`. DIPH5 is the persistent native evaluation cache. Never edit derived assets to change the ontology.

Source quotations and scholarly argument remain in [cited documentation](resources.md); parameter files do not replace the primary texts. See [running and publishing](running.md).
