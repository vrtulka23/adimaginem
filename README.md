# Ad Imaginem

A cited, interactive atlas of Thomistic philosophy and Catholic theology. The static Astro website includes an ontology graph, guided tours, and scholarly documentation.

```sh
./setup.sh --web             # Local Astro website
./setup.sh --python          # Lightweight Python graph viewer
./setup.sh --diph5           # Rebuild the evaluated DIPL snapshot
./setup.sh --build           # Static website in dist/
./setup.sh --help            # All commands
```

The website build needs a supported Node release (22.12+, 24, or 26), Python 3, and the native `snt` CLI. The Python viewer needs only Python, SNT, and a browser. `setup.sh` installs locked npm dependencies when needed.

Canonical concepts, relations, citations, tours, and graph parameters live in [`dip/`](dip/), using [SNT3/DIPL](https://github.com/scinumtools/snt3). Generated website data is a build artifact. The site preserves a [scholarly and Catholic method](docs/method.md).

The [GitHub Pages workflow](.github/workflows/pages.yml) builds and publishes on pushes to `main`; pull requests build and test without deploying. Set **Settings → Pages → Source → GitHub Actions** in the repository once.

See [running and publishing](docs/running.md), [dependencies](docs/dependencies.md), and the [documentation index](docs/index.md).
