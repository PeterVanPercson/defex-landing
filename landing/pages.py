"""The legal pages: privacy, terms, security, and security.txt."""
from datetime import date

from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_safe

from .discovery import CANONICAL_ORIGIN

LEGAL_EFFECTIVE = date(2026, 9, 24)
# security.txt must carry an expiry (RFC 9116). Renew it before this date.
SECURITY_TXT_EXPIRES = "2027-09-24T00:00:00Z"


DOCS = {
    "privacy": {"title": "Privacy Policy", "eyebrow": "Legal", "heading": "Privacy.", "effective": LEGAL_EFFECTIVE,
                "description": "How Defex Robotics, Inc. collects, uses and protects personal information on defexrobotics.com."},
    "terms": {"title": "Terms of Use", "eyebrow": "Legal", "heading": "Terms.", "effective": LEGAL_EFFECTIVE,
              "description": "The terms for using defexrobotics.com, the website of Defex Robotics, Inc."},
    "security": {"title": "Security", "eyebrow": "Legal", "heading": "Security.",
                 "description": "How Defex Robotics protects factory and website data, and how to report a vulnerability."},
}


def render_doc(request, slug, **extra):
    return render(request, f"landing/legal/{slug}.html", {"doc": dict(DOCS[slug], slug=slug), **extra})



@require_safe
def privacy(request):
    return render_doc(request, "privacy")


@require_safe
def terms(request):
    return render_doc(request, "terms")


@require_safe
def security(request):
    return render_doc(request, "security")


@require_safe
def security_txt(request):
    body = (
        "Contact: mailto:security@defexrobotics.com\n"
        f"Expires: {SECURITY_TXT_EXPIRES}\n"
        "Preferred-Languages: en\n"
        f"Canonical: {CANONICAL_ORIGIN}/.well-known/security.txt\n"
        f"Policy: {CANONICAL_ORIGIN}/security/\n"
    )
    return HttpResponse(body, content_type="text/plain; charset=utf-8")


def press_gone(request):
    """/press/ was live for an afternoon and sat in the sitemap."""
    return redirect("/", permanent=True)
