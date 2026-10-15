"""Record the hash of static/css + static/js in static/ASSET_HASH.

Templates cache-bust CSS/JS with ?v=DEFEX_ASSET_VERSION, so a change to those
files that ships without a version bump leaves returning browsers on the old
copy (PR #128). landing/test_qa.py fails until the version is bumped and this
script is re-run.

    python scripts/asset_hash.py          # write static/ASSET_HASH
    python scripts/asset_hash.py --check  # exit 1 if it is stale
"""
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"
HASH_FILE = STATIC / "ASSET_HASH"
HASHED_DIRS = ("css", "js")


def asset_files():
    files = []
    for name in HASHED_DIRS:
        files += [p for p in (STATIC / name).rglob("*") if p.is_file() and p.name != ".DS_Store"]
    return sorted(files, key=lambda p: p.relative_to(STATIC).as_posix())


def asset_hash():
    digest = hashlib.sha256()
    for path in asset_files():
        digest.update(path.relative_to(STATIC).as_posix().encode() + b"\0")
        digest.update(hashlib.sha256(path.read_bytes()).hexdigest().encode() + b"\n")
    return digest.hexdigest()


def settings_version():
    text = (ROOT / "config" / "settings.py").read_text()
    return re.search(r'DEFEX_ASSET_VERSION\s*=\s*os\.getenv\("DEFEX_ASSET_VERSION",\s*"([^"]+)"\)', text).group(1)


def recorded():
    try:
        version, digest = HASH_FILE.read_text().split()
    except (FileNotFoundError, ValueError):
        return None, None
    return version, digest


def main(argv):
    version, digest = settings_version(), asset_hash()
    old_version, old_digest = recorded()
    if "--check" in argv:
        if (old_version, old_digest) != (version, digest):
            print("static/ASSET_HASH is stale: bump DEFEX_ASSET_VERSION and update static/ASSET_HASH")
            return 1
        return 0
    if old_digest is not None and old_digest != digest and old_version == version:
        print(f"static/css or static/js changed but DEFEX_ASSET_VERSION is still {version}: bump it first")
        return 1
    HASH_FILE.write_text(f"{version} {digest}\n")
    print(f"static/ASSET_HASH = {version} {digest}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
