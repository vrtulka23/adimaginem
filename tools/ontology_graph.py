#!/usr/bin/env python3
"""Run the ontology viewer with native Python loading."""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
import json
import subprocess
from time import perf_counter
from urllib.parse import urlsplit

from build_ontology_graph import ROOT, TOOLS, VIEWER_FILES


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
        elif path.removeprefix("/") in VIEWER_FILES:
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
    from ontology_data import load_ontology

    started = perf_counter()
    data = load_ontology(include_viewer=True, report=lambda message: print(message, flush=True))
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
    args = parser.parse_args()
    try:
        handler = python_handler()
        serving = "Python viewer with cached native SNT data"
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
