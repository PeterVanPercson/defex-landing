import json
import logging
import re
from datetime import date

from django.conf import settings
from django.contrib import messages
from django.http import Http404, HttpResponse, JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .forms import ApplicationForm, ContactForm
from .notify import application_email, autoresponder_email, client_ip, send, send_to, submission_email
from .throttle import client_ident, rate_limited

log = logging.getLogger(__name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# This deployment has no database: sqlite is not writable on Vercel and nothing
# else is wired up. So a notification that fails is an enquiry that is gone.
# Until there is somewhere durable to put it, the submission goes to the log at
# ERROR, where Vercel keeps it and it can be read back by hand. What must never
# happen is the visitor being told it worked.
LOST_MESSAGE = ("That did not send. Please email husan@defex.app directly "
                "and we will pick it up from there.")

CONTACT_LABELS = {"name": "name", "factory": "company",
                  "contact": "email, phone or WeChat", "product": "the part"}
APPLICATION_LABELS = {"name": "name", "email": "email", "role": "role",
                      "work": "work link", "profile": "profile link", "note": "note"}


def _log_lost(kind: str, data: dict, detail: str) -> None:
    log.error("%s notification FAILED (%s). Submission was: %s",
              kind, detail, json.dumps(data, default=str, ensure_ascii=False))


def _what_to_fix(form, labels: dict) -> str:
    """Name the fields that failed. A generic 'something looked off' makes the
    visitor re-read the whole form to find the one field they missed."""
    if form.is_bound and form.errors:
        named = [labels.get(f, f) for f in form.errors if f != "website"]
        if named:
            return "Check " + ", ".join(named) + ", then send it again."
    return "Something looked off. Try again, or email husan@defex.app directly."


def home(request):
    return render(request, "landing/home.html", {"form": ContactForm(), "asset_v": settings.DEFEX_ASSET_VERSION})


def careers(request):
    return render(request, "landing/careers.html", {"form": ApplicationForm()})


@require_http_methods(["POST"])
def apply(request):
    if rate_limited("apply", client_ident(request),
                    settings.CONTACT_RATE_LIMIT, settings.CONTACT_RATE_WINDOW):
        messages.error(request, "That is a lot of applications. Try again a little later.")
        return redirect(reverse("careers") + "#application")
    form = ApplicationForm(request.POST)
    if form.is_valid() and not form.is_spam():
        subject, html = application_email(form.cleaned_data, request)
        ok, detail = send(subject, html)
        if ok:
            messages.success(request, "Got it. We read every one and reply to the ones we can move on.")
        else:
            _log_lost("application", form.cleaned_data, detail)
            messages.error(request, LOST_MESSAGE)
    else:
        messages.error(request, _what_to_fix(form, APPLICATION_LABELS))
    return redirect(reverse("careers") + "#application")


def book(request):
    """The booker moved onto the home page. This was live and indexed, so it
    redirects rather than 404s."""
    return redirect("/#contact", permanent=True)


def where_it_started(request):
    return render(request, "landing/origin.html", {"asset_v": settings.DEFEX_ASSET_VERSION})


# Blog. One registry, so the index, the sitemap and the article page cannot
# disagree about what is published. Each post's body is its own template under
# templates/landing/blog/, named by slug; the shell around it is _article.html.
POSTS = (
    {
        "slug": "the-cost-of-the-next-attempt",
        "title": "The Cost of the Next Attempt",
        "dek": ("Robots need a practical way to learn from physical work: knowing whether "
                "an attempt succeeded, understanding what happened during contact, and "
                "preparing the world for another try. We are designing a manufacturing "
                "workcell around that cycle."),
        "date": date(2026, 8, 30),
        "minutes": 9,
        "author": {"name": "Husan Mavlonov", "url": "https://husanmavlonov.com/", "site": "husanmavlonov.com",
                   "bio": "Founder of Defex, building assembly robots that test their own work, in San Francisco."},
        "keywords": ("robot learning, connector assembly, robot reset, acceptance test, "
                     "trials per hour, self-teaching robots, manufacturing robotics, defex"),
    },
)


def _post(slug):
    for post in POSTS:
        if post["slug"] == slug:
            return dict(post, url="https://defex.app" + reverse("blog_post", kwargs={"slug": slug}))
    raise Http404


def blog(request):
    return render(request, "landing/blog/index.html", {"posts": POSTS})


def blog_post(request, slug):
    return render(request, f"landing/blog/{slug}.html", {"post": _post(slug)})


# Crawl surface. Both are views rather than static files so they cannot drift
# out of sync with urls.py, and so Vercel serves them from the same function.
SITEMAP_PAGES = (
    ("home", "1.0", "weekly"),
    ("where_it_started", "0.7", "monthly"),
    ("careers", "0.8", "weekly"),
    ("blog", "0.8", "weekly"),
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
    pages = [(reverse(name), today, freq, prio) for name, prio, freq in SITEMAP_PAGES]
    pages += [(reverse("blog_post", kwargs={"slug": post["slug"]}), post["date"].isoformat(), "monthly", "0.7")
              for post in POSTS]
    urls = "".join(
        f"<url><loc>{request.build_absolute_uri(path)}</loc>"
        f"<lastmod>{lastmod}</lastmod><changefreq>{freq}</changefreq>"
        f"<priority>{prio}</priority></url>"
        for path, lastmod, freq, prio in pages
    )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        f"{urls}</urlset>"
    )
    return HttpResponse(xml, content_type="application/xml; charset=utf-8")


@require_http_methods(["POST"])
def contact(request):
    if rate_limited("contact", client_ident(request),
                    settings.CONTACT_RATE_LIMIT, settings.CONTACT_RATE_WINDOW):
        messages.error(request, "That is a lot of messages. Try again a little later.")
        referer = request.META.get("HTTP_REFERER", "/")
        return redirect(referer.split("#")[0] + "#contact")
    form = ContactForm(request.POST)
    if form.is_valid() and not form.is_spam():
        data = form.cleaned_data
        # Admin notification → NOTIFY_TO (safe: only ever emails the owner).
        subject, html = submission_email(data, request)
        ok, detail = send(subject, html)
        # Autoresponder → the address the visitor typed. This emails an
        # arbitrary third party, so it's the spam-amplification surface.
        # AUTORESPONDER=0 in the env kills it instantly with no redeploy —
        # flip it the moment abuse shows up, until a captcha is wired.
        if not ok:
            _log_lost("contact", data, detail)
            messages.error(request, LOST_MESSAGE)
        else:
            contact_field = (data.get("contact") or "").strip()
            if settings.AUTORESPONDER and EMAIL_RE.match(contact_field):
                a_subject, a_html = autoresponder_email(data.get("name", ""), data.get("factory", ""))
                send_to(contact_field, a_subject, a_html, from_addr=settings.AUTORESPONDER_FROM)
            messages.success(request, "Got it. We reply within one working day.")
    else:
        messages.error(request, _what_to_fix(form, CONTACT_LABELS))
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
    # Origin stops a *browser* on another site from posting here. It stops
    # nothing else: curl sets any header it likes. The throttle below is what
    # limits a direct script, and this endpoint only ever mails PING_TO, so the
    # worst case is Husan's own inbox, not a third party's.
    if origin not in PING_ORIGINS:
        return _cors(JsonResponse({"ok": False, "error": "origin"}, status=403), origin)
    if rate_limited("ping", client_ident(request),
                    settings.CONTACT_RATE_LIMIT, settings.CONTACT_RATE_WINDOW):
        return _cors(JsonResponse({"ok": False, "error": "rate"}, status=429), origin)

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
    # `detail` is the provider's raw error text. It carries no key material, but
    # it is upstream infrastructure detail and there is no reason to hand it to
    # an anonymous caller. Owner sees it in the logs; DEBUG sees it in the body.
    if not ok:
        log.warning("ping send failed: %s", detail)
    body = {"ok": True, "sent": ok}
    if settings.DEBUG:
        body["detail"] = detail
    return _cors(JsonResponse(body), origin)
