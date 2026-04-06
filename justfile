set positional-arguments

# This repo uses `just` as the main task runner for local development.
# Use `just --list` to see the supported workflows and short descriptions.

# Show the available development commands.
default:
    @just --list

# Writes the wasm binary and bundled JS into `public/`, then copies the
# static files so the result is ready to serve directly.

# Build the web assets in development mode.
build:
    wasm-pack build --no-typescript --target web --dev
    cp pkg/caniuse_rs_bg.wasm public/caniuse_rs.wasm
    rollup src/main.js --format iife --file public/caniuse_rs.js
    cp -r static/. public/

# This is the production-oriented build used by `deploy`.

# Build the web assets with release-mode wasm output.
build-release:
    wasm-pack build --no-typescript --target web
    cp pkg/caniuse_rs_bg.wasm public/caniuse_rs.wasm
    rollup src/main.js --format iife --file public/caniuse_rs.js
    cp -r static/. public/

# The embedded server rewrites unknown paths to `index.html`, which keeps client-side
# routing working during local development.

# Build development assets, then serve `public/` locally with SPA fallback.
serve: build
    #!/usr/bin/env python3
    # `SimpleHTTPRequestHandler` is enough here; the only custom behavior
    # we need is SPA fallback for client-side routes.
    import http.server
    import pathlib

    root = pathlib.Path("public").resolve()

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(root), **kwargs)

        def do_GET(self):
            path = self.translate_path(self.path)
            if not pathlib.Path(path).exists():
                self.path = "/index.html"
            return super().do_GET()

    # Bind to localhost only; this is for local development, not LAN sharing.
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 8000), Handler)
    print("Starting development server on http://localhost:8000")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

# This is useful for checking the release wasm bundle locally before deploy.

# Build release assets, then serve `public/` locally with SPA fallback.
serve-release: build-release
    #!/usr/bin/env python3
    # Keep the release server behavior identical to `serve`; only the build
    # mode changes.
    import http.server
    import pathlib

    root = pathlib.Path("public").resolve()

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(root), **kwargs)

        def do_GET(self):
            path = self.translate_path(self.path)
            if not pathlib.Path(path).exists():
                self.path = "/index.html"
            return super().do_GET()

    server = http.server.ThreadingHTTPServer(("127.0.0.1", 8000), Handler)
    print("Starting development server on http://localhost:8000")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

# This first stages the generated `public/` directory on the remote machine, then syncs
# it into the live document root with `sudo`.

# Build release assets and upload them to the production host.
deploy: build-release
    rsync -rzz public caniuse.rs:/tmp/caniuse/
    ssh caniuse.rs 'set -e; sudo chown root: /tmp/caniuse/public; sudo rsync -r --delete /tmp/caniuse/public/* /srv/http/caniuse.rs/; sudo rm -r /tmp/caniuse/public'
