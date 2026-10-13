#!/usr/bin/env python3
"""Run the ontology viewer with native Python loading or static WebAssembly."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
import json
from pathlib import Path
import subprocess
import sys
from time import perf_counter
from urllib.parse import urlsplit

from build_ontology_graph import build_site, DEFAULT_OUTPUT, DEFAULT_SNT_ROOT, ROOT, TOOLS


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      ".mjs": "text/javascript", ".wasm": "application/wasm"}

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


class PythonHandler(Handler):
    """Serve one native evaluation and the shared viewer's source assets."""

    def __init__(self, *args, ontology_bytes, html_bytes, **kwargs):
        self.ontology_bytes = ontology_bytes
        self.html_bytes = html_bytes
        super().__init__(*args, directory=str(TOOLS), **kwargs)

    def send_head(self):
        path = urlsplit(self.path).path
        if path in ("/", "/index.html", "/ontology_graph.html"):
            body, content_type = self.html_bytes, "text/html; charset=utf-8"
        elif path == "/api/ontology":
            body, content_type = self.ontology_bytes, "application/json; charset=utf-8"
        elif path in ("/ontology_graph.js", "/ontology_loader.mjs", "/relationship_summary.mjs", "/selection_force.mjs"):
            return super().send_head()
        else:
            self.send_error(404, "Unknown viewer resource")
            return None
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        return BytesIO(body)


def python_handler():
    sys.path.insert(0, str(ROOT))
    from adimaginem import load_ontology

    print("Evaluating DIPL natively with SNT…", flush=True)
    started = perf_counter()
    data = load_ontology(include_viewer=True)
    ontology_bytes = json.dumps(data, ensure_ascii=False, allow_nan=False).encode("utf-8")
    html = (TOOLS / "ontology_graph.html").read_text(encoding="utf-8")
    html = html.replace("</head>", '<meta name="ontology-endpoint" content="./api/ontology">\n</head>', 1)
    print(f"Loaded {len(data['ontology']['concepts'])} concepts and "
          f"{len(data['ontology']['edges'])} edges in {perf_counter() - started:.1f}s. "
          "Refreshes reuse this data; restart after DIPL changes.", flush=True)
    return partial(PythonHandler, ontology_bytes=ontology_bytes, html_bytes=html.encode("utf-8"))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--mode", choices=("python", "web"), default="python",
                        help="python: cache native DIPL evaluation (default); web: browser WebAssembly")
    parser.add_argument("--output", type=Path, help="Static build folder (web mode only)")
    parser.add_argument("--snt-root", type=Path, help="SNT web checkout (web mode only)")
    parser.add_argument("--no-build", action="store_true", help="Serve an existing static build (web mode only)")
    args = parser.parse_args()
    if args.mode == "python" and (args.no_build or args.output or args.snt_root):
        parser.error("--no-build, --output, and --snt-root require --mode web")
    try:
        if args.mode == "python":
            handler = python_handler()
            serving = "Python mode: shared viewer with cached native SNT data"
        else:
            output = (args.output or DEFAULT_OUTPUT).resolve()
            if not args.no_build:
                output = build_site(output, args.snt_root or DEFAULT_SNT_ROOT)
            if not (output / "index.html").is_file():
                raise ValueError(f"No static site found at {output}; build it first")
            handler = partial(Handler, directory=str(output))
            serving = f"WebAssembly mode: static site at {output}"
        server = ThreadingHTTPServer((args.host, args.port), handler)
    except (OSError, RuntimeError, ValueError, subprocess.CalledProcessError) as error:
        parser.exit(1, f"ontology graph: {error}\n")
    print(f"{serving}\nOpen http://{args.host}:{args.port}/ (Ctrl-C to stop).", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping ontology graph server.", flush=True)
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
