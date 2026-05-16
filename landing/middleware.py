"""Visitor tracker: one notification email per browser per ~24h.

Dedup is COOKIE-based, not server-cache based. On serverless (Vercel)
every request can hit a fresh instance, so an in-process cache (LocMem)
never dedupes — you'd get an email on every single page load. A cookie
travels with the browser and works statelessly.

Set VISITOR_PINGS=0 in the environment to turn this off entirely
(recommended once you have real analytics — see notes).
"""
from __future__ import annotations

import logging
import os
import re

from .notify import send, visitor_email

log = logging.getLogger(__name__)

_ENABLED = os.getenv("VISITOR_PINGS", "1") != "0"
_COOKIE = "dxv"
_MAX_AGE = 60 * 60 * 24  # 24h

# Common bot / crawler signatures we don't want to email about.
_BOT_RE = re.compile(
    r"bot|spider|crawler|crawling|slurp|googlebot|bingbot|baiduspider|yandex|"
    r"ahrefs|semrush|mj12|dotbot|petalbot|facebookexternalhit|"
    r"go-http-client|python-requests|curl/|wget/|httpx|node-fetch|axios|"
    r"uptimerobot|pingdom|statuscake|datadog|newrelic|prometheus|vercel",
    re.IGNORECASE,
)

_IGNORE_PREFIXES = ("/static/", "/admin", "/favicon", "/robots", "/sitemap")


class VisitorTrackerMiddleware:
    """Email once per browser per 24h on real page loads."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        try:
            if self._should_notify(request):
                subject, html = visitor_email(request)
                send(subject, html)  # synchronous — serverless-safe
                response.set_cookie(
                    _COOKIE, "1",
                    max_age=_MAX_AGE,
                    secure=True,
                    httponly=True,
                    samesite="Lax",
                )
        except Exception as e:  # never break the site over a notification
            log.warning("visitor tracker error: %s", e)
        return response

    def _should_notify(self, request) -> bool:
        if not _ENABLED:
            return False
        if request.method != "GET":
            return False
        if request.COOKIES.get(_COOKIE):
            return False
        path = request.path
        if any(path.startswith(p) for p in _IGNORE_PREFIXES):
            return False
        ua = request.META.get("HTTP_USER_AGENT", "")
        if not ua or _BOT_RE.search(ua):
            return False
        return True
