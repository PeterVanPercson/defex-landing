import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


parser = argparse.ArgumentParser(description="Package the built connector lab for a local demonstration.")
parser.add_argument("output", type=Path)
parser.add_argument("--evidence", type=Path, required=True)
parser.add_argument("--video", type=Path, required=True)
args = parser.parse_args()
project = Path(__file__).resolve().parents[2]
html = project / "templates/landing/prototype.html"
assets = project / "static/prototype"
if not html.is_file() or not (assets / "assets").is_dir():
    parser.error("Run npm run build:site before packaging.")
if not args.video.is_file():
    parser.error("The recorded demo video is missing.")

files = {"index.html": html.read_bytes(), "prototype/index.html": html.read_bytes()}
for source in sorted(assets.rglob("*")):
    if source.is_file():
        files[source.relative_to(project).as_posix()] = source.read_bytes()
for name in ("connector.xml", "demo-traces.json", "perturbation-check.json"):
    source = args.evidence / name
    if not source.is_file():
        parser.error(f"Missing evidence: {source}")
    files[f"evidence/{name}"] = source.read_bytes()
files["recording.mp4"] = args.video.read_bytes()
files["serve.py"] = b'''import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

parser = argparse.ArgumentParser(description="Serve the Defex software demo on this computer.")
parser.add_argument("--port", type=int, default=8200)
args = parser.parse_args()

class DemoHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".wasm": "application/wasm", ".js": "text/javascript"}

root = Path(__file__).resolve().parent
handler = partial(DemoHandler, directory=str(root))
with ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
    print(f"Open http://127.0.0.1:{args.port}/ in your browser. Ctrl+C stops the demo.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
'''
files["README.md"] = '''# Defex connector lab — portable demonstration

This is an illustrative software simulation. No physical robot runs this loop. The contact search is deterministic calibration, not a trained policy. Electrical continuity and latch retention are simplified acceptance models.

## Open the interactive demo

1. Extract this ZIP.
2. In the extracted `defex-connector-lab` folder, run `python3 serve.py`.
3. Open **http://127.0.0.1:8200/** and click **Watch the experiment**.
4. Keep the tab in view while it runs. Stop the local server with Ctrl+C.

Python 3 is the only server prerequisite. If port 8200 is busy, run `python3 serve.py --port 8201` and use that port. Do not open `index.html` directly as a file: browser workers and WASM need an HTTP origin.

All runtime assets are included. No Node installation, API key, Google account or cloud GPU is required. The server listens only on this computer. A localhost link cannot be opened by someone on another computer.

The 3D view needs WebGL. Use **http://127.0.0.1:8200/?view=schematic** for the 2D view with the same physics. Model notes explain the assumptions. Only the documentation link opens an external website.

## The short demonstration

- A nominal fixed path meets a shifted socket and stops on contact.
- A search retracts and tries offsets until both modeled checks accept a result.
- The saved XY correction is reused for a fresh checked attempt.
- An injected open circuit rejects a seated connector even though retention passes.

Change conditions, try the no-latch fault, inspect the geometry and export run data. Records live in the current browser session and clear on reload.

## Video and evidence

`recording.mp4` is the 18.5-second recording of the computed four-part experiment. It carries a simulation label and can be played without the local server.

`evidence/demo-traces.json` contains the full selected traces. `evidence/perturbation-check.json` contains the broader fixed-seed check: 15 of 32 searches accepted, with 0 of 32 naive nominal paths accepted. These chosen software cases do not estimate factory reliability or compare against a competent industrial baseline. `evidence/connector.xml` is the MuJoCo model.

MuJoCo 3.14.0 and Three.js 0.186.1 license copies are in `static/prototype/licenses`. `manifest.json` records SHA-256 hashes for this bundle's other files. The package contains no credentials or private fundraising documents.

## Hosting

The site files can be served by a static web host from its root, preserving `/static/prototype/`. Serve `.wasm` as `application/wasm`, JavaScript as `text/javascript`, and enable compression. A server or browser cache must receive HTML and the matching hashed assets together. No backend API is required.

Public hosting requires a separate deployment. This ZIP does not publish anything or alter defexrobotics.com.
'''.encode()
manifest = {
    "model": "connector-contact-v1",
    "stage": "illustrative software simulation",
    "files": {name: {"bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()} for name, content in sorted(files.items())},
}
files["manifest.json"] = (json.dumps(manifest, indent=2) + "\n").encode()
args.output.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(args.output, "w", compression=ZIP_DEFLATED, compresslevel=9) as bundle:
    for name, content in sorted(files.items()):
        bundle.writestr(f"defex-connector-lab/{name}", content)
print(json.dumps({"archive": str(args.output.resolve()), "files": len(files), "bytes": args.output.stat().st_size}))
