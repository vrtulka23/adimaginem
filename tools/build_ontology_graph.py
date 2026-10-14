#!/usr/bin/env python3
"""Package original DIPL sources and the SNT web runtime as a static website."""

import argparse
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
TOOLS = Path(__file__).resolve().parent
DEFAULT_OUTPUT = ROOT / "build" / "ontology-graph"
DEFAULT_SNT_ROOT = ROOT.parent / "scinumtools3"
VIEWER_FILES = (
    "ontology_graph.js", "ontology_loader.mjs", "relationship_summary.mjs", "selection_force.mjs", "web_ontology_adapter.mjs",
    "web_ontology_loader.mjs", "web_ontology_worker.mjs", "guided_tours.mjs",
)


def build_site(output=DEFAULT_OUTPUT, snt_root=DEFAULT_SNT_ROOT):
    output, snt_root = Path(output).resolve(), Path(snt_root).resolve()
    runtime_files = {
        "index.mjs": snt_root / "bindings/web/index.mjs",
        "dist/dipl_web.mjs": snt_root / "bindings/web/dist/dipl_web.mjs",
        "dist/dipl_web.wasm": snt_root / "bindings/web/dist/dipl_web.wasm",
        "LICENSE": snt_root / "LICENSE",
    }
    for path in runtime_files.values():
        if not path.is_file():
            raise ValueError(f"Missing SNT web artifact: {path}. Build bindings/web in the SNT checkout first.")
    with tempfile.TemporaryDirectory(prefix="adimaginem-static-") as temporary:
        bundle = Path(temporary) / "ontology.bundle.json"
        subprocess.run([
            "snt", "dip", "package", "--project", str(ROOT / "dip/DIPfile"),
            "--output", str(bundle),
        ], cwd=ROOT / "dip", check=True)
        output.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(bundle, output / bundle.name)
    shutil.copyfile(TOOLS / "ontology_graph.html", output / "index.html")
    for name in VIEWER_FILES:
        shutil.copyfile(TOOLS / name, output / name)
    for name, source in runtime_files.items():
        destination = output / "snt-web" / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
    (output / ".nojekyll").touch()
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--snt-root", type=Path, default=DEFAULT_SNT_ROOT)
    args = parser.parse_args()
    try:
        output = build_site(args.output, args.snt_root)
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        parser.exit(1, f"static graph build: {error}\n")
    print(f"Static site ready: {output}")


if __name__ == "__main__":
    main()
