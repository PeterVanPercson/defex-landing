"""Notify IndexNow of canonical, live site URLs. Dry run unless --submit is set.

Only the public ownership key and public sitemap are read. No account login,
analytics credentials, visitor information or private company facts are used.
"""
import argparse
import json
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

ORIGIN = "https://defexrobotics.com"
KEY_URL = ORIGIN + "/indexnow-key.txt"
ENDPOINT = "https://api.indexnow.org/indexnow"


def fetch(url, method="GET"):
    request = Request(url, method=method, headers={"User-Agent": "Defex-Publication-Check/1.0"})
    with urlopen(request, timeout=20) as response:
        body = response.read(1_000_001) if method != "HEAD" else b""
        if len(body) > 1_000_000:
            raise ValueError("Unexpectedly large public response")
        if response.geturl() != url:
            raise ValueError("Unexpected redirect for " + url)
        return body, response.headers


def read_public_payload(expected_sha=None):
    if expected_sha:
        _, headers = fetch(ORIGIN + "/company.json")
        if headers.get("X-Defex-Revision") != expected_sha:
            raise ValueError("The requested production revision is not live yet")
    key = fetch(KEY_URL)[0].decode("utf-8").strip()
    if not re.fullmatch(r"[a-f0-9]{64}", key):
        raise ValueError("The production ownership key is not ready")
    xml = fetch(ORIGIN + "/sitemap.xml")[0]
    root = ET.fromstring(xml)
    urls = [node.text for node in root.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
    if not urls or len(urls) > 100:
        raise ValueError("Unexpected sitemap URL count")
    for url in urls:
        parts = urlsplit(url)
        if parts.scheme != "https" or parts.netloc != "defexrobotics.com" or parts.query or parts.fragment:
            raise ValueError("Noncanonical URL rejected")
        _, headers = fetch(url, method="HEAD")
        if "noindex" in headers.get("X-Robots-Tag", "").lower():
            raise ValueError("Noindex URL rejected")
        if "text/html" not in headers.get("Content-Type", ""):
            raise ValueError("Non-HTML sitemap URL rejected")
    return {"host": "defexrobotics.com", "key": key, "keyLocation": KEY_URL, "urlList": sorted(set(urls))}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--submit", action="store_true")
    parser.add_argument("--expected-sha", default=None)
    parser.add_argument("--wait-seconds", type=int, default=0)
    args = parser.parse_args()
    if not 0 <= args.wait_seconds <= 600:
        parser.error("wait-seconds must be between 0 and 600")
    if args.expected_sha and not re.fullmatch(r"[a-f0-9]{40}", args.expected_sha):
        parser.error("expected-sha must be a full Git commit SHA")
    deadline = time.monotonic() + args.wait_seconds
    while True:
        try:
            payload = read_public_payload(args.expected_sha)
            break
        except (HTTPError, URLError, ValueError, ET.ParseError, TimeoutError) as exc:
            if time.monotonic() >= deadline:
                raise SystemExit("Production preflight failed: " + str(exc)) from exc
            print("Waiting for the production deployment...", flush=True)
            time.sleep(10)
    # Do not print the ownership key into workflow logs.
    print(json.dumps({"urls": payload["urlList"], "mode": "submit" if args.submit else "dry-run"}, indent=2))
    if not args.submit:
        return
    request = Request(ENDPOINT, data=json.dumps(payload).encode("utf-8"),
                      headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": "Defex-Publication-Check/1.0"}, method="POST")
    try:
        with urlopen(request, timeout=30) as response:
            status = response.status
    except HTTPError as exc:
        raise SystemExit("IndexNow returned HTTP " + str(exc.code) + "; no indexing claim is made") from exc
    if status not in (200, 202):
        raise SystemExit("Unexpected IndexNow response: " + str(status))
    print("IndexNow HTTP " + str(status) + ": URLs received. Indexing and ranking are not guaranteed.")


if __name__ == "__main__":
    main()
