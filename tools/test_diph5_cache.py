"""Cache lifecycle checks; real SNT round-trip parity is checked separately."""

from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
from diph5_cache import load_cached


class SnapshotCacheTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.sources = self.root / "dip"
        self.sources.mkdir()
        self.project = self.sources / "DIPfile"
        self.project.write_text("project")
        self.schema = self.sources / "schema.dipl"
        self.schema.write_text("original schema")
        self.executable = self.root / "snt"
        self.executable.write_text("original executable")
        self.cache = self.root / "cache"
        self.version = "0.9.4"
        self.builds = 0
        self.fail = False
        self.which = patch("diph5_cache.shutil.which", return_value=str(self.executable))
        self.which.start()
        self.addCleanup(self.which.stop)

    def command(self, args):
        if args[-1] == "--version":
            return self.version
        self.builds += 1
        output = Path(args[-1])
        output.write_text("partial" if self.fail else "complete")
        if self.fail:
            raise RuntimeError("evaluation failed")
        return ""

    def read(self, snapshot, snt):
        value = snapshot.read_text()
        if value != "complete":
            raise RuntimeError("bad snapshot")
        return value

    def load(self, read=None):
        return load_cached(self.project, self.cache, self.command, read or self.read)

    def test_reuse_and_source_schema_tool_invalidation(self):
        self.assertEqual(self.load(), "complete")
        self.assertEqual(self.load(), "complete")
        self.assertEqual(self.builds, 1)
        self.schema.write_text("changed schema")
        self.load()
        self.project.write_text("changed project")
        self.load()
        self.version = "0.9.5"
        self.load()
        self.executable.write_text("changed executable")
        self.load()
        self.assertEqual(self.builds, 5)
        extra = self.sources / "extra.dipl"
        extra.write_text("additional input")
        self.load()
        self.assertEqual(self.builds, 6)
        extra.unlink()
        self.load()
        self.assertEqual(self.builds, 6)  # Returns to the previously cached content.

    def test_explicit_rebuild_replaces_matching_snapshot(self):
        self.load()
        load_cached(self.project, self.cache, self.command, self.read, rebuild=True)
        self.assertEqual(self.builds, 2)
        self.assertEqual(len(list(self.cache.glob("*.diph5"))), 1)

    def test_corrupt_snapshot_rebuilt(self):
        self.load()
        next(self.cache.glob("*.diph5")).write_text("broken")
        self.assertEqual(self.load(), "complete")
        self.assertEqual(self.builds, 2)
        self.assertEqual(len(list(self.cache.glob("*.diph5"))), 1)

    def test_failure_does_not_publish_partial_snapshot(self):
        self.fail = True
        with self.assertRaisesRegex(RuntimeError, "evaluation failed"):
            self.load()
        self.assertEqual(list(self.cache.iterdir()), [])

    def test_metadata_read_failure_does_not_publish(self):
        def reject(snapshot, snt):
            raise ValueError("missing citation metadata")
        with self.assertRaisesRegex(ValueError, "missing citation"):
            self.load(reject)
        self.assertEqual(list(self.cache.iterdir()), [])

    def test_edit_during_load_does_not_publish(self):
        def edit(snapshot, snt):
            self.schema.write_text("edited during evaluation")
            return self.read(snapshot, snt)
        with self.assertRaisesRegex(RuntimeError, "changed during loading"):
            self.load(edit)
        self.assertEqual(list(self.cache.iterdir()), [])


if __name__ == "__main__":
    unittest.main()
