"""The plain pages: contact, press, privacy, terms, security, and security.txt."""
from datetime import date

from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.http import require_safe

from .discovery import CANONICAL_ORIGIN

LEGAL_EFFECTIVE = date(2026, 9, 24)
# security.txt must carry an expiry (RFC 9116). Renew it before this date.
SECURITY_TXT_EXPIRES = "2027-09-24T00:00:00Z"

DESKS = (
    {"name": "Sales", "what": "Pricing, a bench test or a robot for your part.", "email": "sales@defexrobotics.com"},
    {"name": "Support", "what": "Help with a robot on your floor.", "email": "support@defexrobotics.com"},
    {"name": "Press", "what": "Stories, interviews and the media kit.", "email": "press@defexrobotics.com"},
    {"name": "Careers", "what": "Jobs and applications.", "email": "careers@defexrobotics.com"},
    {"name": "Security", "what": "Report a security problem.", "email": "security@defexrobotics.com"},
    {"name": "Privacy", "what": "Questions about your data.", "email": "privacy@defexrobotics.com"},
    {"name": "Everything else", "what": "The whole team reads it.", "email": "team@defexrobotics.com"},
)

DOCS = {
    "contact": {"title": "Contact", "eyebrow": "Contact", "heading": "Talk to us.",
                "lead": "Pick the right inbox. We reply within one working day.",
                "description": "Contact Defex Robotics: sales, support, press, careers, security and privacy."},
    "press": {"title": "Press", "eyebrow": "Press", "heading": "Press.",
              "lead": "Everything you need to write about Defex.",
              "description": "Defex Robotics press page: company boilerplate, founders, media kit and press contact."},
    "privacy": {"title": "Privacy Policy", "eyebrow": "Legal", "heading": "Privacy.", "effective": LEGAL_EFFECTIVE,
                "description": "How Defex Robotics, Inc. collects, uses and protects personal information on defexrobotics.com."},
    "terms": {"title": "Terms of Use", "eyebrow": "Legal", "heading": "Terms.", "effective": LEGAL_EFFECTIVE,
              "description": "The terms for using defexrobotics.com, the website of Defex Robotics, Inc."},
    "security": {"title": "Security", "eyebrow": "Security", "heading": "Security.",
                 "lead": "How we protect your data, and how to tell us about a problem.",
                 "description": "How Defex Robotics protects factory and website data, and how to report a vulnerability."},
}


def render_doc(request, slug, **extra):
    return render(request, f"landing/legal/{slug}.html", {"doc": dict(DOCS[slug], slug=slug), **extra})


def contact_page(request):
    return render_doc(request, "contact", desks=DESKS)


@require_safe
def press(request):
    return render_doc(request, "press")


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
