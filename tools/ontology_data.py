"""Native SNT loader shared by the static website build and Python viewer.

SNT 0.9.5 exports values, array shapes, and metadata together. Older SNT uses
a values export plus bulk inspection; both paths preserve the viewer contract.
"""

import json
import re
import subprocess
import tempfile
from pathlib import Path
from time import monotonic

from diph5_cache import load_cached
from snt_metadata import decode_metadata, normalize_source_citations


ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "dip" / "DIPfile"
EDGE_SOURCE_PATH = re.compile(r"^ontology\.edges\[([^]]+)\]\.source_id$")
PROFILE_SOURCE_PATH = re.compile(r"^ontology\.passion_profiles\[([^]]+)\]\.source_id$")


def _run(command, report=None, activity="Running SNT"):
    started = monotonic()
    with subprocess.Popen(command, cwd=ROOT, text=True, stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE) as process:
        try:
            while True:
                try:
                    stdout, stderr = process.communicate(timeout=5 if report else None)
                    break
                except subprocess.TimeoutExpired:
                    report(f"{activity} · {monotonic() - started:.0f}s elapsed")
        except BaseException:
            process.kill()
            process.communicate()
            raise
        if process.returncode:
            raise RuntimeError(f"{' '.join(map(str, command))}: {stderr.strip()}")
    return stdout


def load_ontology(include_viewer=False, report=None, rebuild=False):
    """Return SNT ontology values and cited rationales.

    The graph viewer can opt into its separate DIPL layout settings; they stay
    alongside the ontology rather than inside its concept registry.
    """
    return load_cached(PROJECT, ROOT / "build" / "diph5",
                       lambda command: _run(command, report, "Preparing DIPH5 snapshot"),
                       lambda snapshot, snt: _read_snapshot(snapshot, snt, include_viewer, report), report, rebuild=rebuild)


def _read_snapshot(snapshot, snt, include_viewer, report=None):
    """Read values and all rationale/category metadata from one evaluated state."""
    started = monotonic()
    notify = report or (lambda message: None)
    version = _run([snt, "--version"]).strip()
    match = re.search(r"(\d+)\.(\d+)\.(\d+)", version)
    metadata_export = bool(match and tuple(map(int, match.groups())) >= (0, 9, 5))
    activity = "Reading values and metadata" if metadata_export else "Reading values"
    notify(f"Snapshot [0/3] {activity}…")
    with tempfile.TemporaryDirectory(prefix="adimaginem-") as temporary:
        output = Path(temporary) / "ontology.json"
        _run([snt, "dip", "parse", "--load", str(snapshot),
              "--generate", "json-metadata" if metadata_export else "json", str(output)],
             report, f"Snapshot [0/3] {activity}")
        exported = json.loads(output.read_text(encoding="utf-8"))
    if metadata_export:
        notify("Snapshot [1/3] Values and metadata exported; restoring declared array shapes…")
        data, listing = decode_metadata(exported)
    else:
        data = exported
        notify(f"Snapshot [1/3] Values read ({len(data['ontology']['concepts'])} concepts, "
               f"{len(data['ontology']['edges'])} relations); reading citation and category metadata…")

    # SNT's JSON generator renders a one-element array as a scalar. This
    # schema-defined field must remain a sequence for both static and Python delivery.
    for concept in data["ontology"]["concepts"].values():
        if isinstance(concept.get("study_areas"), str):
            concept["study_areas"] = [concept["study_areas"]]

    for record in data["ontology"].get("support_records", {}).values():
        if isinstance(record.get("grounding"), str):
            record["grounding"] = [record["grounding"]]

    # Estimate from JSON tree size, then use SNT's total if export omitted
    # nodes. Never silently truncate metadata as the ontology grows.
    def tree_size(value):
        if isinstance(value, dict):
            return 1 + sum(tree_size(child) for child in value.values())
        if isinstance(value, list):
            return 1 + sum(tree_size(child) for child in value)
        return 1

    def describe_all(limit):
        return json.loads(_run([snt, "dip", "list", "--input", str(snapshot),
                                "--query", "?", "--limit", str(limit),
                                "--max-value-elements", "0", "--format", "json"],
                               report, "Snapshot [1/3] Reading metadata"))

    if not metadata_export:
        listing = describe_all(tree_size(data))
        if listing.get("truncated"):
            notify(f"Snapshot [1/3] Retrying metadata read with room for all {listing['total']} records…")
            listing = describe_all(listing["total"])
    if listing.get("truncated") or len(listing["items"]) != listing["total"]:
        raise RuntimeError("SNT metadata listing is incomplete")
    normalize_source_citations(data, listing["items"])
    notify(f"Snapshot [2/3] Read {len(listing['items'])} metadata records; "
           "assembling citations, tours, and display settings…")

    rationales = {}
    for item in listing["items"]:
        match = EDGE_SOURCE_PATH.fullmatch(item["path"])
        if match:
            rationale = item["metadata"].get("rationale", "")
            if match.group(1) in rationales:
                raise RuntimeError(f"duplicate metadata for edge {match.group(1)}")
            rationales[match.group(1)] = rationale
    profile_rationales = {}
    for item in listing["items"]:
        match = PROFILE_SOURCE_PATH.fullmatch(item["path"])
        if match:
            if match.group(1) in profile_rationales:
                raise RuntimeError(f"duplicate metadata for passion {match.group(1)}")
            profile_rationales[match.group(1)] = item["metadata"].get("rationale", "")
    support_rationales = {}
    for item in listing["items"]:
        match = re.fullmatch(r"ontology\.support_records\[([^]]+)\]\.source_id", item["path"])
        if match:
            if match[1] in support_rationales:
                raise RuntimeError(f"duplicate metadata for support {match[1]}")
            support_rationales[match[1]] = item["metadata"].get("rationale", "")
    if set(support_rationales) != set(data["ontology"].get("support_records", {})) or not all(support_rationales.values()):
        raise RuntimeError("Every support record needs rationale metadata")
    result = {"support_rationales": support_rationales, "ontology": data["ontology"], "rationales": rationales,
              "profile_rationales": profile_rationales}
    if include_viewer and "graph_viewer" in data:
        result["graph_viewer"] = data["graph_viewer"]
        result["graph_layout"] = data["graph_layout"]
        for settings in result["graph_viewer"].values():
            if isinstance(settings.get("structural_link_kinds"), str):
                settings["structural_link_kinds"] = [settings["structural_link_kinds"]]
        for collection, arrays in {
            "graph_tours": ("audience_tags", "topic_tags", "step_ids"),
            "graph_tour_steps": ("source_ids", "concept_ids", "edge_ids", "highlighted_concept_ids", "highlighted_edge_ids"),
            "graph_tour_positions": (),
        }.items():
            result[collection] = data[collection]
            for record in result[collection].values():
                for field in arrays:
                    if isinstance(record.get(field), str):
                        record[field] = [record[field]]
        for palette in ("graph_concept_styles", "graph_relation_colors"):
            colors = data[palette]
            for item in listing["items"]:
                match = re.fullmatch(rf"{palette}\[([^\]]+)\]\.color", item["path"])
                if match:
                    colors[match.group(1)]["metadata"] = {"category": item["metadata"]["category"]}
            for key, color in colors.items():
                if not color.get("metadata", {}).get("category"):
                    raise ValueError(f"{palette}[{key}].color needs ?category metadata")
                if not re.fullmatch(r"#[0-9a-fA-F]{6}", color["color"]):
                    raise ValueError(f"{palette}[{key}].color must be a six-digit hex color")
            result[palette] = colors
        if set(result["graph_concept_styles"]) != set(data["ontology"]["concepts"]):
            raise ValueError("Every ontology concept needs exactly one graph_concept_styles entry")
    notify(f"Snapshot [3/3] Ready · {monotonic() - started:.1f}s total")
    return result



if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Rebuild the evaluated DIPH5 ontology snapshot")
    parser.add_argument("--rebuild-snapshot", action="store_true", required=True)
    parser.parse_args()
    try:
        data = load_ontology(include_viewer=True, rebuild=True,
                             report=lambda message: print(message, flush=True))
    except (OSError, RuntimeError, ValueError) as error:
        parser.exit(1, f"snapshot rebuild: {error}\n")
    print(f"Persisted {len(data['ontology']['concepts'])} concepts and {len(data['ontology']['edges'])} relations.")
