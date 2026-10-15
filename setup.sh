#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

help() {
  cat <<'HELP'
Ad Imaginem — website and graph tools

Usage: ./setup.sh ACTION [server options]

  -w, --web       Start the local Astro website (exports current DIPL first)
  -p, --python    Start the Python graph viewer; no Node/Astro required
  -d, --diph5     Force a fresh DIPL evaluation and rebuild its DIPH5 snapshot
  -b, --build     Build the static GitHub Pages website into dist/
  -s, --preview   Serve an existing dist/ website locally
  -c, --check     Build, run integrity/unit checks, and check site links
  -i, --install   Install locked npm dependencies
  -h, --help      Show this help

Examples:
  ./setup.sh --web --host 127.0.0.1 --port 4321
  ./setup.sh --python --port 8878
  ./setup.sh --diph5
  BASE_PATH=/adimaginem/ ./setup.sh --build

DIPL loading needs Python 3 and the native snt CLI on PATH.
Astro needs a supported even-numbered Node release (22.12+, 24, or 26).
Server options are forwarded to Astro or the Python viewer. Ctrl-C stops it.
HELP
}

require_python() {
  command -v python3 >/dev/null || { echo 'Install Python 3 first.' >&2; exit 1; }
  command -v snt >/dev/null || { echo 'Install the native SNT CLI and put snt on PATH; see docs/dependencies.md.' >&2; exit 1; }
}

supported_node() {
  command -v node >/dev/null && node -e 'const [major,minor]=process.versions.node.split(".").map(Number);process.exit(major%2===0&&(major>22||major===22&&minor>=12)?0:1)' 2>/dev/null
}

require_node() {
  if ! supported_node; then
    # Prefer an already installed supported Homebrew Node without changing
    # the user's global shell or installing a different system runtime.
    for directory in /opt/homebrew/opt/node@24/bin /opt/homebrew/opt/node@26/bin /opt/homebrew/opt/node@22/bin /usr/local/opt/node@24/bin /usr/local/opt/node@26/bin /usr/local/opt/node@22/bin; do
      if [[ -x "$directory/node" ]]; then
        export PATH="$directory:$PATH"
        if supported_node; then break; fi
      fi
    done
  fi
  supported_node || { echo 'Install a supported Node release (22.12+, 24, or 26), then retry.' >&2; exit 1; }
  command -v npm >/dev/null || { echo 'npm is required with Node.' >&2; exit 1; }
}

install_if_needed() {
  require_node
  if [[ ! -f node_modules/astro/package.json ]]; then npm ci --no-audit --no-fund; fi
}

action=${1:---help}
if [[ $# -gt 0 ]]; then shift; fi
case "$action" in
  -h|--help) help ;;
  -w|--web) require_python; install_if_needed; exec npm run dev -- "$@" ;;
  -p|--python) require_python; exec python3 tools/ontology_graph.py "$@" ;;
  -d|--diph5) require_python; exec python3 tools/ontology_data.py --rebuild-snapshot "$@" ;;
  -b|--build) require_python; install_if_needed; exec npm run build -- "$@" ;;
  -s|--preview)
    install_if_needed
    [[ -f dist/index.html ]] || { echo 'No built website. Run ./setup.sh --build first.' >&2; exit 1; }
    exec npm run preview -- "$@"
    ;;
  -c|--check)
    require_python; install_if_needed
    npm run build
    npm test
    npm run check:site
    ;;
  -i|--install) require_node; exec npm ci --no-audit --no-fund "$@" ;;
  *) echo "Unknown action: $action. Use ./setup.sh --help." >&2; exit 2 ;;
esac
