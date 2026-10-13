#!/usr/bin/env python3
"""Compare the built WebAssembly viewer data with the native Python loader."""
import argparse
import json
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from adimaginem import load_ontology


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", type=Path, default=ROOT / "build/ontology-graph")
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix="adimaginem-parity-") as temporary:
        expected = Path(temporary) / "python.json"
        expected.write_text(json.dumps(load_ontology(include_viewer=True), ensure_ascii=False), encoding="utf-8")
        subprocess.run(["node", str(ROOT / "tools/verify_web_parity.mjs"),
                        str(args.site.resolve()), str(expected)], check=True)


if __name__ == "__main__":
    main()
