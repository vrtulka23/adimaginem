"""Verify the authored citation schema with the installed native SNT CLI."""

import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


SCHEMA = Path(__file__).resolve().parents[1] / "dip/schemas/ontological_source.dipl"
BIBLIOGRAPHY = {
    "authors": "Thomas Aquinas",
    "title": "Summa theologiae",
    "url": "https://www.newadvent.org/summa/1075.htm",
}


@unittest.skipUnless(shutil.which("snt"), "Native SNT CLI not installed")
class CitationSchemaTests(unittest.TestCase):
    def parse(self, metadata, *options):
        source = "sources map : citation\nsources[example]\n"
        source += "".join(f"  ?{key} {json.dumps(value)}\n"
                          for key, value in metadata.items())
        # DIPL preserves backslash-t literally; exercise an actual tab here.
        source = source.replace("\\t", "\t")
        source += '  locator = "I, q. 75, a. 4, respondeo"\n'
        return subprocess.run(
            ["snt", "dip", "parse", "-i", "schema_file", "citation", str(SCHEMA),
             "-i", "string", source, *map(str, options)],
            capture_output=True, text=True, timeout=30)

    def test_missing_and_empty_citation_metadata_rejected_by_snt(self):
        for field in BIBLIOGRAPHY:
            for value in (None, "", " \t "):
                with self.subTest(field=field, value=value):
                    metadata = dict(BIBLIOGRAPHY)
                    if value is None:
                        del metadata[field]
                    else:
                        metadata[field] = value
                    result = self.parse(metadata)
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn("Schema metadata constraint failed", result.stderr)
                    self.assertIn("sources[example]", result.stderr)
                    self.assertIn(f"?{field}", result.stderr)
                    self.assertIn("nonempty", result.stderr)

    def test_valid_citation_preserved_through_export_and_snapshot(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            snapshot = root / "citation.diph5"
            direct = root / "direct.json"
            restored = root / "restored.json"
            result = self.parse(BIBLIOGRAPHY, "--save", snapshot,
                                "--generate", "json-metadata", direct)
            self.assertEqual(result.returncode, 0, result.stderr)
            result = subprocess.run(
                ["snt", "dip", "parse", "--load", str(snapshot),
                 "--generate", "json-metadata", str(restored)],
                capture_output=True, text=True, timeout=30)
            self.assertEqual(result.returncode, 0, result.stderr)
            for path in (direct, restored):
                export = json.loads(path.read_text())
                self.assertEqual(export["schema"], "snt-dip-values/2")
                metadata = export["node_metadata"]["sources[example]"]["metadata"]
                self.assertEqual(set(metadata["present"]), set(BIBLIOGRAPHY))
                self.assertEqual(metadata["values"], BIBLIOGRAPHY)


if __name__ == "__main__":
    unittest.main()
