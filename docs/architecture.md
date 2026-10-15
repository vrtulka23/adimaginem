# Architecture

## Website and data flow

Ad Imaginem is a static Astro website with a dedicated interactive graph page. Its source material and graph parameters remain authored in DIPL.

```text
dip/DIPfile + schemas + cited records
                  ↓ SNT evaluation
        build/diph5/<fingerprint>.diph5
                  ↓ Python extraction of values and metadata
        public/graph-assets/ontology.json
                  ↓ shared JavaScript integrity checks
          Astro pages + docs/ Markdown
                  ↓
           dist/ → GitHub Pages
```

- **DIPL and SNT3** define and evaluate concepts, relations, sources, tours, and display settings. Schemas carry record contracts; citation rationales and category metadata are retained during extraction.
- **Python** creates or reuses the evaluated DIPH5 snapshot and exports the browser data contract. `tools/ontology_data.py` is the shared loader; `tools/diph5_cache.py` manages snapshot freshness and atomic publication.
- **Astro** generates the landing page, `/graph/`, and documentation pages from `docs/`. The graph page reuses the same HTML and JavaScript as the Python viewer. Deployment consists of static files.
- **JavaScript** validates graph integrity and handles rendering, selection, paths, explanations, filters, and tours. `ontology_validation.mjs` checks concept and source references, relation vocabulary, condition citations, passion profiles, and palettes. It also invokes the existing support-record and guided-tour validators. The build and browser both run these checks.

The graph's relationships describe cited distinctions and claims. They do not implement a psychological simulation or turn a path into a new theological inference. Interpretive choices remain subject to the [scholarly method](method.md).

## Two ways to view

The published site fetches a generated static ontology asset. Visitors do not install SNT or evaluate DIPL. Browser rendering still uses the existing visualization libraries and icons from CDNs.

The standalone Python server serves the same graph directly and holds evaluated data in memory. It needs no Astro installation. Both delivery modes use the same native loader and browser validation. Restart the Python server or rebuild the static site after DIPL changes.

## Cache boundaries

DIPH5 stores an evaluated environment, including the values and citation metadata needed by this project. Cache identity includes all files in the self-contained `dip/` tree, their names, the project location, SNT executable identity, and SNT version. A forced rebuild is available through `./setup.sh --diph5`.

Snapshot publication is atomic and occurs after successful reads. Input changes during loading are rejected. An unreadable cache entry is rebuilt once from canonical DIPL. Complete source-program reevaluation and new schema instantiation remain SNT operations on DIPL sources, not on the snapshot.

The cache currently assumes every evaluation input lives in `dip/`. External imports, environment-dependent evaluation, runtime overrides, or in-place replacement of SNT shared libraries require extending cache identity before use. Derived files under `build/`, `public/graph-assets/`, and `dist/` are ignored by Git.

See [running and publishing](running.md) and [dependencies](dependencies.md).
