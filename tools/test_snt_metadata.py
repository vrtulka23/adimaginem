"""Export compatibility checks for the SNT 0.9.5 adapter."""

import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from snt_metadata import decode_metadata, shaped_value, normalize_source_citations


def record(value, shape=None, metadata=None):
    return {"value": value, "shape": shape or [], "is_array": shape is not None,
            "presence": "value", "metadata": {"present": list(metadata or {}),
                                                "values": metadata or {}}}


class MetadataExportTests(unittest.TestCase):
    def citation_export(self, schema, on_container=False):
        bibliography = {"authors": "Thomas Aquinas", "title": "Summa theologiae",
                        "url": "https://example.org/text"}
        path = "ontology.sources[test]"
        export = {"schema": schema, "values": {
            path + ".locator": record("I, q. 75, a. 4", metadata={} if on_container else bibliography)}}
        if schema.endswith("/2"):
            target = path if on_container else path + ".locator"
            export["node_metadata"] = {target: {
                "kind": "map_item" if on_container else "value",
                "metadata": {"present": list(bibliography), "values": dict(bibliography)}}}
        return export

    def test_bibliography_normalizes_identically_from_v1_value_or_v2_container(self):
        results = []
        for schema, on_container in [("snt-dip-values/1", False),
                                     ("snt-dip-values/2", False),
                                     ("snt-dip-values/2", True)]:
            data, listing = decode_metadata(self.citation_export(schema, on_container))
            normalize_source_citations(data, listing["items"])
            results.append(data)
        self.assertEqual(results[0], results[1])
        self.assertEqual(results[1], results[2])
        self.assertEqual(results[0]["ontology"]["sources"]["test"]["author"], "Thomas Aquinas")

    def test_empty_missing_and_conflicting_bibliography_are_rejected(self):
        for change, expected in [
            (lambda m: m.update(authors=""), "empty"),
            (lambda m: m.pop("authors"), "missing author"),
        ]:
            export = self.citation_export("snt-dip-values/1")
            metadata = export["values"]["ontology.sources[test].locator"]["metadata"]
            change(metadata["values"])
            metadata["present"] = list(metadata["values"])
            data, listing = decode_metadata(export)
            with self.assertRaisesRegex(ValueError, expected):
                normalize_source_citations(data, listing["items"])
        export = self.citation_export("snt-dip-values/1")
        export["values"]["ontology.sources[test].author"] = record("Different author")
        data, listing = decode_metadata(export)
        with self.assertRaisesRegex(ValueError, "conflicting author"):
            normalize_source_citations(data, listing["items"])

    def test_legacy_fields_survive_absent_metadata_defaults_from_old_inspection(self):
        source = {"author": "Author", "work": "Work", "url": "https://example.org"}
        data = {"ontology": {"sources": {"test": dict(source)}}}
        normalize_source_citations(data, [{"path": "ontology.sources[test].locator",
            "metadata": {"authors": "", "title": "", "url": "", "present": []}}])
        self.assertEqual(data["ontology"]["sources"]["test"], source)

    def test_v2_inventory_required_and_duplicate_value_metadata_must_agree(self):
        export = self.citation_export("snt-dip-values/2")
        export["node_metadata"]["ontology.sources[test].locator"]["metadata"]["values"]["authors"] = "Other"
        with self.assertRaisesRegex(ValueError, "Conflicting SNT"):
            decode_metadata(export)
        export.pop("node_metadata")
        with self.assertRaisesRegex(ValueError, "requires a node_metadata"):
            decode_metadata(export)

    def test_declared_array_shapes_not_field_name_heuristics(self):
        self.assertEqual(shaped_value(record("single", [1])), ["single"])
        self.assertEqual(shaped_value(record("single")), "single")
        self.assertEqual(shaped_value(record(5, [1, 1])), [[5]])
        self.assertEqual(shaped_value(record([[1, 2], [3, 4]], [2, 2])), [[1, 2], [3, 4]])
        with self.assertRaisesRegex(ValueError, "shape"):
            shaped_value(record([1, 2], [3]))

    def test_metadata_presence_and_numeric_list_indices_survive_export_order(self):
        values = {f"graph_layout.concept_order[{index}].id": record(f"concept_{index}")
                  for index in reversed(range(12))}
        values["ontology.edges[test].source_id"] = record("source", metadata={"rationale": "Cited reason"})
        values["ontology.edges[test].conditions"] = {**record(None), "presence": "none"}
        values["ontology.concepts[test].note"] = record("text", metadata={"descr": ""})
        data, listing = decode_metadata({"schema": "snt-dip-values/1", "values": values})
        self.assertEqual(data["graph_layout"]["concept_order"][10]["id"], "concept_10")
        self.assertNotIn("conditions", data["ontology"]["edges"]["test"])
        self.assertEqual(listing["items"][0]["metadata"]["rationale"], "Cited reason")
        self.assertEqual(listing["items"][1]["metadata"], {"descr": ""})

    def test_unknown_schema_or_incomplete_order_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "schema"):
            decode_metadata({"schema": "future-format"})
        with self.assertRaisesRegex(ValueError, "Non-contiguous"):
            decode_metadata({"schema": "snt-dip-values/1", "values": {
                "graph_layout.concept_order[1].id": record("missing_first")}})


if __name__ == "__main__":
    unittest.main()
