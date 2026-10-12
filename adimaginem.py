"""Python entry point for the cited Rust ontology core.

SNT evaluates the canonical DIPL project; its inspection API supplies metadata
which SNT 0.9.4's values-only JSON generator does not include.
"""

import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PROJECT = ROOT / "dip" / "DIPfile"
EDGE_SOURCE_PATH = re.compile(r"^ontology\.edges\[([^]]+)\]\.source_id$")


def _run(command):
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(f"{' '.join(map(str, command))}: {result.stderr.strip()}")
    return result.stdout


def load_ontology():
    """Return SNT evaluated values and all edge citation rationales."""
    with tempfile.TemporaryDirectory(prefix="adimaginem-") as temporary:
        output = Path(temporary) / "ontology.json"
        _run(["snt", "dip", "parse", "--project", str(PROJECT),
              "--generate", "json", str(output)])
        data = json.loads(output.read_text(encoding="utf-8"))

    listing = json.loads(_run(["snt", "dip", "list", "--project", str(PROJECT),
                               "--query", "?ontology.edges.", "--limit", "10000",
                               "--format", "json"]))
    if listing.get("truncated") or len(listing["items"]) != listing["total"]:
        raise RuntimeError("SNT metadata listing is incomplete")

    rationales = {}
    for item in listing["items"]:
        match = EDGE_SOURCE_PATH.fullmatch(item["path"])
        if match:
            rationale = item["metadata"].get("rationale", "")
            if match.group(1) in rationales:
                raise RuntimeError(f"duplicate metadata for edge {match.group(1)}")
            rationales[match.group(1)] = rationale
    return {"ontology": data["ontology"], "rationales": rationales}


def query(command, concept_id=None, relation=None):
    """Evaluate DIPL, then invoke the Rust core through its JSON process interface."""
    request = {"command": command, "data": load_ontology()}
    if concept_id is not None:
        request["id"] = concept_id
    if relation is not None:
        request["relation"] = relation
    result = subprocess.run(["cargo", "run", "--quiet", "--manifest-path",
                             str(ROOT / "Cargo.toml")], input=json.dumps(request),
                            text=True, capture_output=True, cwd=ROOT)
    if result.returncode:
        raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout)


def main():
    parser = argparse.ArgumentParser(description="Query the cited DIPL ontology")
    subcommands = parser.add_subparsers(dest="command", required=True)
    subcommands.add_parser("validate")
    concept = subcommands.add_parser("concept")
    concept.add_argument("id")
    outgoing = subcommands.add_parser("outgoing")
    outgoing.add_argument("id")
    outgoing.add_argument("--relation")
    arguments = parser.parse_args()
    try:
        result = query(arguments.command, getattr(arguments, "id", None),
                       getattr(arguments, "relation", None))
    except (RuntimeError, OSError, ValueError) as error:
        parser.exit(1, f"adimaginem: {error}\n")
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
