#!/usr/bin/env python3
"""Generate Astro's static graph assets from canonical DIPL using native SNT."""

import argparse
import json
from pathlib import Path
import shutil
import tempfile

from ontology_data import load_ontology

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "tools"
DEFAULT_OUTPUT = ROOT / "public" / "graph-assets"
VIEWER_FILES = (
    "ontology_graph.js", "ontology_loader.mjs", "ontology_validation.mjs",
    "relationship_summary.mjs", "selection_force.mjs", "source_support.mjs", "guided_tours.mjs", "graph_layout.mjs",
)


def build_site(output=DEFAULT_OUTPUT):
    output = Path(output).resolve()
    data = load_ontology(include_viewer=True, report=lambda message: print(message, flush=True))
    output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".export-", dir=output) as temporary:
        payload = Path(temporary) / "ontology.json"
        payload.write_text(json.dumps(data, ensure_ascii=False, allow_nan=False,
                                      separators=(",", ":")), encoding="utf-8")
        payload.replace(output / "ontology.json")
    for name in VIEWER_FILES:
        shutil.copyfile(TOOLS / name, output / name)
    print(f"Exported {len(data['ontology']['concepts'])} concepts and "
          f"{len(data['ontology']['edges'])} relations to {output}", flush=True)
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    try:
        build_site(args.output)
    except (OSError, RuntimeError, ValueError) as error:
        parser.exit(1, f"graph export: {error}\n")


if __name__ == "__main__":
    main()
