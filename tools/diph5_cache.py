"""Content-addressed SNT snapshots for this repository's self-contained dip tree."""

from hashlib import sha256
from pathlib import Path
import shutil
import tempfile


def fingerprint(source_root, executable, version):
    """Hash content, including schemas and filenames; mtimes are insufficient."""
    digest = sha256()
    for value in (b"adimaginem-diph5-v1", str(source_root.resolve()).encode(),
                  str(executable.resolve()).encode(), version.encode(), executable.read_bytes()):
        digest.update(len(value).to_bytes(8, "big"))
        digest.update(value)
    for path in sorted(source_root.rglob("*")):
        if path.is_file():
            for value in (path.relative_to(source_root).as_posix().encode(), path.read_bytes()):
                digest.update(len(value).to_bytes(8, "big"))
                digest.update(value)
    return digest.hexdigest()


def load_cached(project, cache_dir, run, read, report=None, rebuild=False):
    """Read a matching DIPH5, or evaluate once and atomically publish after use.

    All project inputs must live beneath project.parent (as in dip/DIPfile).
    No overrides are accepted here: a future override API must fingerprint them.
    `read` must consume the snapshot completely before returning.
    """
    executable = shutil.which("snt")
    if executable is None:
        raise RuntimeError("SNT is required: install snt and put it on PATH")
    executable = Path(executable).resolve()
    version = run([str(executable), "--version"]).strip()
    key = fingerprint(project.parent, executable, version)
    cache_dir.mkdir(parents=True, exist_ok=True)
    snapshot = cache_dir / f"{key}.diph5"
    report = report or (lambda message: None)

    def unchanged():
        if fingerprint(project.parent, executable, version) != key:
            raise RuntimeError("DIPL or SNT changed during loading; retry to load a consistent snapshot")

    if snapshot.is_file() and not rebuild:
        report("Reading cached DIPH5 snapshot…")
        try:
            result = read(snapshot, str(executable))
        except (RuntimeError, ValueError, OSError, KeyError, TypeError) as error:
            report(f"DIPH5 cache could not be read; rebuilding from DIPL ({type(error).__name__}).")
        else:
            unchanged()
            return result
    else:
        report("Evaluating DIPL and creating a DIPH5 snapshot…")

    # A private staging directory permits concurrent readers/builders. A failed
    # parse/read never publishes a partial snapshot over a usable cache entry.
    with tempfile.TemporaryDirectory(prefix=".staging-", dir=cache_dir) as temporary:
        staged = Path(temporary) / "ontology.diph5"
        run([str(executable), "dip", "parse", "--project", str(project), "--save", str(staged)])
        result = read(staged, str(executable))
        unchanged()
        staged.replace(snapshot)
        return result
