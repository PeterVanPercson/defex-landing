"""Run real Nebius calls; retain measured evidence without inventing scores."""
import argparse
import json
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()
from django.conf import settings
from landing.quality_review import ReviewError, generate_report, summarize
from landing.review_views import sample_text

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--output", required=True, help="JSON output path; existing files are not overwritten")
args = parser.parse_args()
target = Path(args.output)
if target.exists():
    parser.error("Output exists; choose a new path.")
if not settings.NEBIUS_API_KEY or not settings.NEBIUS_MODEL:
    parser.error("Set NEBIUS_API_KEY and NEBIUS_MODEL. This evaluation makes paid provider calls.")
cases = {
    "defect-spike": "Identify the later-hour increase in FAIL rate; stitch-gap is the observed class. Cause remains unknown.",
    "clean-run": "Report zero FAIL decisions without claiming zero real defects or guaranteeing shipment quality.",
    "uncertain": "Flag low and missing confidence. Require manual checking; do not treat model scores as calibrated accuracy.",
}
results = []
for case, expected in cases.items():
    started = time.perf_counter()
    item = {"case": case, "input_kind": "synthetic", "expected": expected,
            "human_quality_score": None, "human_notes": "Not yet reviewed"}
    try:
        item["output"] = generate_report(summarize(sample_text(case)))
        item["status"] = "success"
    except ReviewError as error:
        item.update(status="error", error=str(error), code=error.code)
    item["task_seconds"] = round(time.perf_counter() - started, 3)
    results.append(item)
target.parent.mkdir(parents=True, exist_ok=True)
with target.open("x") as stream:
    json.dump({"model": settings.NEBIUS_MODEL, "provider": "Nebius Token Factory",
               "quality_rubric": "Score 1 only if expected finding is present, numbers agree with source, and no unsupported causal claim appears; otherwise 0. Fill manually after reviewing each full output.",
               "attempts": len(results), "successful_reports": sum(r["status"] == "success" for r in results),
               "results": results}, stream, indent=2)
print(f"Saved {len(results)} real attempts to {target}. Quality scores require human review.")

sys.exit(1 if any(r["status"] != "success" for r in results) else 0)
