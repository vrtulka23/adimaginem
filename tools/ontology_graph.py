#!/usr/bin/env python3
"""Serve an interactive 3D browser view of the cited DIPL ontology."""

from __future__ import annotations

import argparse
import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TOOLS = Path(__file__).resolve().parent


def load_data() -> dict:
    """Use SNT's evaluator and the project's metadata-aware loader."""
    sys.path.insert(0, str(ROOT))
    from adimaginem import load_ontology

    return load_ontology(include_viewer=True)


class Handler(BaseHTTPRequestHandler):
    data: bytes = b"{}"

    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        if self.path in ("/", "/index.html"):
            body = (TOOLS / "ontology_graph.html").read_bytes()
            content_type = "text/html; charset=utf-8"
        elif self.path in ("/ontology_graph.js", "/relationship_summary.mjs"):
            body = (TOOLS / self.path[1:]).read_bytes()
            content_type = "text/javascript; charset=utf-8"
        elif self.path == "/api/ontology":
            body = self.data
            content_type = "application/json; charset=utf-8"
        else:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt: str, *args: object) -> None:
        pass


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1", help="Bind address (default: localhost only)")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    try:
        data = load_data()
    except (OSError, RuntimeError, ValueError) as exc:
        parser.exit(1, f"ontology graph: could not evaluate DIPL project: {exc}\n")

    ontology = data["ontology"]
    Handler.data = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(
        f"Loaded {len(ontology['concepts'])} concepts and {len(ontology['edges'])} edges.\n"
        f"Open http://{args.host}:{args.port}/ (Ctrl-C to stop).",
        flush=True,
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping ontology graph server.", flush=True)
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
