"""Export compatibility checks for the SNT 0.9.5 adapter."""

import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from snt_metadata import decode_metadata, shaped_value


def record(value, shape=None, metadata=None):
    return {"value": value, "shape": shape or [], "is_array": shape is not None,
            "presence": "value", "metadata": {"present": list(metadata or {}),
                                                "values": metadata or {}}}


class MetadataExportTests(unittest.TestCase):
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
