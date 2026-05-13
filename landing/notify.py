"""Resend HTTP API wrapper + visitor enrichment.

Email is sent in a background thread so request latency is unaffected.
If Resend isn't configured (no API key), calls log and return silently —
the site still works, you just don't get pings.
"""
from __future__ import annotations

import logging
import threading
from html import escape

import requests
from django.conf import settings

log = logging.getLogger(__name__)

RESEND_URL = "https://api.resend.com/emails"
IPAPI_URL = "https://ipapi.co/{ip}/json/"


def _post(payload: dict) -> None:
    api_key = settings.RESEND_API_KEY
    if not api_key:
        log.info("resend skipped: RESEND_API_KEY not set; would send %s", payload.get("subject"))
        return
    try:
        r = requests.post(
            RESEND_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json=payload,
            timeout=10,
        )
        if r.status_code >= 300:
            log.warning("resend error %s: %s", r.status_code, r.text[:300])
    except requests.RequestException as e:
        log.warning("resend network error: %s", e)


def send(subject: str, html: str) -> None:
    """Fire-and-forget email to NOTIFY_TO via Resend."""
    payload = {
        "from": settings.EMAIL_FROM,
        "to": [settings.NOTIFY_TO],
        "subject": subject,
        "html": html,
    }
    threading.Thread(target=_post, args=(payload,), daemon=True).start()


def send_to(to_addr: str, subject: str, html: str, from_addr: str | None = None) -> None:
    """Send to an arbitrary address. Used for autoresponders."""
    payload = {
        "from": from_addr or settings.EMAIL_FROM,
        "to": [to_addr],
        "subject": subject,
        "html": html,
    }
    threading.Thread(target=_post, args=(payload,), daemon=True).start()


def geolocate(ip: str) -> dict:
    """Best-effort IP enrichment. Returns {} on failure."""
    if not ip or ip.startswith(("127.", "10.", "192.168.", "172.")):
        return {}
    try:
        r = requests.get(IPAPI_URL.format(ip=ip), timeout=4)
        if r.status_code == 200:
            return r.json() or {}
    except requests.RequestException:
        pass
    return {}


def client_ip(request) -> str:
    """Get the real client IP, honoring Render's X-Forwarded-For."""
    fwd = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


def visitor_email(request) -> tuple[str, str]:
    """Build (subject, html) describing a single visitor."""
    ip = client_ip(request)
    ua = request.META.get("HTTP_USER_AGENT", "")
    referrer = request.META.get("HTTP_REFERER", "")
    lang = request.META.get("HTTP_ACCEPT_LANGUAGE", "")
    path = request.get_full_path()

    geo = geolocate(ip)
    city = geo.get("city") or ""
    region = geo.get("region") or ""
    country = geo.get("country_name") or geo.get("country") or ""
    org = geo.get("org") or ""
    location = " · ".join(x for x in (city, region, country) if x) or "unknown"

    subj_loc = country or "unknown"
    subject = f"defex · visit from {subj_loc}"

    rows = [
        ("Location", location),
        ("IP", ip or "—"),
        ("Org / ISP", org or "—"),
        ("Referrer", referrer or "direct"),
        ("Path", path),
        ("Language", lang or "—"),
        ("User-Agent", ua or "—"),
    ]
    body = "".join(
        f'<tr><td style="padding:4px 12px 4px 0;color:#888;font-size:12px;'
        f'vertical-align:top;white-space:nowrap">{escape(k)}</td>'
        f'<td style="padding:4px 0;font-size:13px;word-break:break-all">{escape(v)}</td></tr>'
        for k, v in rows
    )
    html = (
        '<div style="font-family:ui-monospace,monospace;color:#111;max-width:560px">'
        f'<p style="margin:0 0 12px;font-size:14px"><b>New visitor on defex.app</b></p>'
        f'<table style="border-collapse:collapse">{body}</table>'
        '</div>'
    )
    return subject, html


def autoresponder_email(name: str, factory: str) -> tuple[str, str]:
    """(subject, html) sent FROM Husan personally TO the submitter."""
    first = (name or "there").strip().split()[0] if name else "there"
    subject = "got your note — defex"
    html = (
        '<div style="font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;'
        'color:#0F1115;line-height:1.55;max-width:540px">'
        f'<p>Hi {escape(first)},</p>'
        f'<p>Thanks for telling us about {escape(factory) if factory else "your line"}. '
        'We&rsquo;ve received your note and will be in touch within one working day '
        'with next steps and a 15-min slot to talk through your line.</p>'
        '<p>If you&rsquo;d like to share anything ahead of the call '
        '&mdash; photos of typical defects, the inspection role you want to replace, '
        'WeChat ID &mdash; just reply to this email.</p>'
        '<p style="margin-top:24px">&mdash; Husan<br>'
        '<span style="color:#7A7B7F;font-size:13px">defex &middot; '
        '<a href="https://defex.app" style="color:#FF5A1F;text-decoration:none">defex.app</a></span></p>'
        '</div>'
    )
    return subject, html


def submission_email(data: dict, request) -> tuple[str, str]:
    """Build (subject, html) for a contact form submission."""
    name = data.get("name", "")
    factory = data.get("factory", "")
    contact = data.get("contact", "")
    product = data.get("product", "")
    ip = client_ip(request)
    geo = geolocate(ip)
    country = geo.get("country_name") or geo.get("country") or ""

    subject = f"defex · pilot request — {name} ({factory})"
    rows = [
        ("Name", name),
        ("Factory", factory),
        ("Email / WeChat", contact),
        ("Makes", product),
        ("From", country or "—"),
        ("IP", ip or "—"),
    ]
    body = "".join(
        f'<tr><td style="padding:6px 14px 6px 0;color:#888;font-size:12px;'
        f'vertical-align:top;white-space:nowrap">{escape(k)}</td>'
        f'<td style="padding:6px 0;font-size:14px;word-break:break-all">{escape(v) or "—"}</td></tr>'
        for k, v in rows
    )
    html = (
        '<div style="font-family:ui-monospace,monospace;color:#111;max-width:600px">'
        '<p style="margin:0 0 12px;font-size:15px"><b>Pilot request from defex.app</b></p>'
        f'<table style="border-collapse:collapse">{body}</table>'
        '</div>'
    )
    return subject, html
