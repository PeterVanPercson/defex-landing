"""Small, CSRF-protected reporting surface with bounded public samples."""
import hmac
import json
import threading
from pathlib import Path

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET, require_POST

from .quality_review import MAX_BYTES, ReviewError, generate_report, summarize

SAMPLE_DIR = Path(__file__).resolve().parent / "review_samples"
PUBLIC_SAMPLES = {
    "defect-spike": "Defect spike", "clean-run": "No FAIL decisions",
    "uncertain": "Low-confidence decisions",
}
_inference_lock = threading.Lock()


def sample_text(sample_id):
    if sample_id not in PUBLIC_SAMPLES:
        raise ReviewError("Choose one of the available samples.")
    return (SAMPLE_DIR / (sample_id + ".csv")).read_text()


def payload(request):
    try:
        length = int(request.META.get("CONTENT_LENGTH") or 0)
    except ValueError:
        raise ReviewError("Invalid request size.")
    if length > MAX_BYTES * 2:
        raise ReviewError("Use a CSV smaller than 256 KB.", status=413)
    try:
        raw = request.body
        if len(raw) > MAX_BYTES * 2:
            raise ReviewError("Use a CSV smaller than 256 KB.", status=413)
        data = json.loads(raw)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ReviewError("Send a valid JSON request.")
    if not isinstance(data, dict):
        raise ReviewError("Send a JSON object.")
    return data


def input_summary(data):
    sample_id = data.get("sample_id")
    if sample_id:
        if not isinstance(sample_id, str):
            raise ReviewError("Choose one of the available samples.")
        return summarize(sample_text(sample_id)), "synthetic sample: " + sample_id
    if not isinstance(data.get("csv"), str):
        raise ReviewError("Load a sample or select a CSV first.")
    return summarize(data["csv"]), "user-supplied CSV (not independently verified)"


def error_response(error):
    return JsonResponse({"error": str(error), "code": error.code}, status=error.status)


@require_GET
@never_cache
def quality_review(request):
    ready = bool(settings.REVIEW_ENABLED and settings.NEBIUS_API_KEY and settings.NEBIUS_MODEL)
    return render(request, "landing/quality_review.html", {"review_ready": ready,
                   "custom_enabled": bool(settings.REVIEW_ACCESS_CODE)})


@require_GET
def review_sample(request, sample_id):
    try:
        response = HttpResponse(sample_text(sample_id), content_type="text/csv; charset=utf-8")
    except ReviewError as e:
        return error_response(e)
    response["Content-Disposition"] = f'attachment; filename="defex-{sample_id}-synthetic.csv"'
    return response


@require_POST
@never_cache
def review_analyze(request):
    try:
        summary, source = input_summary(payload(request))
        return JsonResponse({"summary": summary, "source": source})
    except ReviewError as e:
        return error_response(e)


@require_POST
@never_cache
def review_generate(request):
    try:
        data = payload(request)
        if data.get("consent") is not True:
            raise ReviewError("Confirm that the aggregate inspection data can be sent to Nebius.")
        if not data.get("sample_id"):
            code = data.get("access_code", "")
            if (not settings.REVIEW_ACCESS_CODE or not isinstance(code, str) or
                    not hmac.compare_digest(code.encode(), settings.REVIEW_ACCESS_CODE.encode())):
                raise ReviewError("Custom-data reporting requires a valid review access code. You can run a sample instead.", "access_required", 403)
        if not settings.REVIEW_ENABLED or not settings.NEBIUS_API_KEY or not settings.NEBIUS_MODEL:
            raise ReviewError("Live reporting is not connected yet. Source statistics remain available.", "not_configured", 503)
        summary, source = input_summary(data)
        key = "quality-report:" + settings.NEBIUS_MODEL + ":" + summary["source_sha256"]
        # Cache only synthetic samples, never uploaded production reports.
        result = cache.get(key) if data.get("sample_id") else None
        if result:
            result["measurement"]["cached"] = True
            return JsonResponse(result)
        # Best-effort per-process limit, NOT a global serverless spending cap.
        # See docs/quality-review.md for required provider/platform budget limits.
        if not _inference_lock.acquire(blocking=False):
            raise ReviewError("Another review is being generated. Try again shortly.", "busy", 429)
        try:
            if not cache.add("quality-review:cooldown", True, timeout=20):
                raise ReviewError("Please allow 20 seconds between new reports.", "rate_limit", 429)
            result = generate_report(summary)
            result["source"] = source
            if data.get("sample_id"):
                cache.set(key, result, timeout=900)
        finally:
            _inference_lock.release()
        return JsonResponse(result)
    except ReviewError as e:
        return error_response(e)
