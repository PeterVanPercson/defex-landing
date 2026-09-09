import json
import re
from datetime import date

from django.conf import settings
from django.contrib import messages
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .forms import ApplicationForm, ContactForm
from .notify import application_email, autoresponder_email, client_ip, send, send_to, submission_email

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def home(request):
    return render(request, "landing/home.html", {"form": ContactForm(), "asset_v": settings.DEFEX_ASSET_VERSION})


def careers(request):
    return render(request, "landing/careers.html", {"form": ApplicationForm()})


@require_http_methods(["POST"])
def apply(request):
    form = ApplicationForm(request.POST)
    if form.is_valid() and not form.is_spam():
        subject, html = application_email(form.cleaned_data, request)
        send(subject, html)
        messages.success(request, "Got it. We read every one and reply to the ones we can move on.")
    else:
        messages.error(request, "Something was missing. Check the links and try again.")
    return redirect(reverse("careers") + "#application")


def where_it_started(request):
    return render(request, "landing/origin.html", {"asset_v": settings.DEFEX_ASSET_VERSION})


# Crawl surface. Both are views rather than static files so they cannot drift
# out of sync with urls.py, and so Vercel serves them from the same function.
SITEMAP_PAGES = (
    ("home", "1.0", "weekly"),
    ("where_it_started", "0.7", "monthly"),
    ("careers", "0.8", "weekly"),
    ("quality_review", "0.8", "monthly"),
)


def robots(request):
    body = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /contact/\n"
        "\n"
        "User-agent: Googlebot\nAllow: /\n"
        "\n"
        "User-agent: Bingbot\nAllow: /\n"
        "\n"
        "User-agent: YandexBot\nAllow: /\n"
        "\n"
        f"Sitemap: {request.build_absolute_uri('/sitemap.xml')}\n"
        "Host: defex.app\n"
    )
    return HttpResponse(body, content_type="text/plain; charset=utf-8")


def sitemap(request):
    today = date.today().isoformat()
    urls = "".join(
        f"<url><loc>{request.build_absolute_uri(reverse(name))}</loc>"
        f"<lastmod>{today}</lastmod><changefreq>{freq}</changefreq>"
        f"<priority>{prio}</priority></url>"
        for name, prio, freq in SITEMAP_PAGES
    )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        f"{urls}</urlset>"
    )
    return HttpResponse(xml, content_type="application/xml; charset=utf-8")


@require_http_methods(["POST"])
def contact(request):
    form = ContactForm(request.POST)
    if form.is_valid() and not form.is_spam():
        data = form.cleaned_data
        # Admin notification → NOTIFY_TO (safe: only ever emails the owner).
        subject, html = submission_email(data, request)
        send(subject, html)
        # Autoresponder → the address the visitor typed. This emails an
        # arbitrary third party, so it's the spam-amplification surface.
        # AUTORESPONDER=0 in the env kills it instantly with no redeploy —
        # flip it the moment abuse shows up, until a captcha is wired.
        contact_field = (data.get("contact") or "").strip()
        if settings.AUTORESPONDER and EMAIL_RE.match(contact_field):
            a_subject, a_html = autoresponder_email(data.get("name", ""), data.get("factory", ""))
            send_to(
                contact_field,
                a_subject,
                a_html,
                from_addr="Husan Mavlonov <husan@buildcored.com>",
            )
        messages.success(request, "Got it — we'll reply within one working day.")
    else:
        messages.error(request, "Something looked off. Try again, or email us directly.")
    referer = request.META.get("HTTP_REFERER", "/")
    return redirect(referer.split("#")[0] + "#contact")


# ---------------------------------------------------------------------------
# /ping/ — husanmavlonov.com asks people for a name + email before it hands out
# the Telegram channel; that page is static (GitHub Pages) so it has no way to
# send mail. This endpoint is the one piece of server it borrows: it only ever
# emails PING_TO (Husan), never the submitter, so it cannot be used to spam a
# third party. Locked to the personal site's origin.
# ---------------------------------------------------------------------------
PING_ORIGINS = {
    "https://husanmavlonov.com",
    "https://www.husanmavlonov.com",
}


def _cors(response, origin):
    if origin in PING_ORIGINS:
        response["Access-Control-Allow-Origin"] = origin
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        response["Access-Control-Max-Age"] = "86400"
    response["Vary"] = "Origin"
    return response


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def ping(request):
    origin = request.META.get("HTTP_ORIGIN", "")
    if request.method == "OPTIONS":
        return _cors(HttpResponse(status=204), origin)
    if origin not in PING_ORIGINS:
        return _cors(JsonResponse({"ok": False, "error": "origin"}, status=403), origin)

    try:
        payload = json.loads((request.body or b"")[:2000].decode("utf-8") or "{}")
    except (ValueError, UnicodeDecodeError):
        return _cors(JsonResponse({"ok": False, "error": "body"}, status=400), origin)

    # honeypot: real people never fill a hidden field
    if str(payload.get("website", "")).strip():
        return _cors(JsonResponse({"ok": True}), origin)

    name = str(payload.get("name", "")).strip()[:80]
    email = str(payload.get("email", "")).strip()[:120]
    if not name or not EMAIL_RE.match(email):
        return _cors(JsonResponse({"ok": False, "error": "fields"}, status=400), origin)

    from html import escape as _esc
    html = (
        '<div style="font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;'
        'color:#0F1115;line-height:1.6;max-width:520px">'
        "<p><strong>Telegram channel request</strong></p>"
        f"<p>name: {_esc(name)}<br>email: {_esc(email)}</p>"
        f'<p style="color:#7A7B7F;font-size:13px">via husanmavlonov.com &middot; ip {_esc(client_ip(request))}</p>'
        "</div>"
    )
    from_addr = settings.EMAIL_FROM or "onboarding@resend.dev"
    to_addr = settings.PING_TO or settings.NOTIFY_TO
    ok, detail = send_to(to_addr, f"telegram request — {name}", html, from_addr=from_addr)
    # The submitter only ever sees ok/false; `detail` is for the site owner
    # debugging his own form, and carries no key material.
    return _cors(JsonResponse({"ok": True, "sent": ok, "detail": detail}), origin)
