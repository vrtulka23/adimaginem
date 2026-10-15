# Graph and website tools

Use the root [`setup.sh`](../setup.sh) script. See [running and publishing](../docs/running.md) for all commands, prerequisites, graph controls, and GitHub Pages deployment.

- `ontology_data.py` and `diph5_cache.py`: native SNT loading and persisted snapshots.
- `build_ontology_graph.py`: generate Astro's static graph assets from DIPL.
- `ontology_graph.py`: standalone Python web server for the graph.
- `ontology_graph.html` and `ontology_graph.js`: shared graph interface.
- `ontology_validation.mjs`: shared graph integrity validation, used by build and browser.
- `validate_ontology.mjs`: validate a generated browser asset.
- `check_site.mjs`: verify the built site's local links and graph data.

`./setup.sh --check` builds and runs the checks. These checks validate structure and delivery; they do not replace scholarly review of the cited claims.
