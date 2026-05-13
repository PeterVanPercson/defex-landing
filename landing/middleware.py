"""Visitor tracker: one notification email per unique IP per day.

Filters out static files, admin, bots, and Render's own health checker.
Falls back gracefully if anything goes wrong — never blocks the response.
"""
from __future__ import annotations

import logging
import re

from django.core.cache import cache

from .notify import client_ip, send, visitor_email

log = logging.getLogger(__name__)

# Common bot / crawler signatures we don't want to email about.
_BOT_RE = re.compile(
    r"bot|spider|crawler|crawling|slurp|googlebot|bingbot|baiduspider|yandex|"
    r"ahrefs|semrush|mj12|dotbot|petalbot|facebookexternalhit|"
    r"go-http-client|python-requests|curl/|wget/|httpx|node-fetch|axios|"
    r"uptimerobot|pingdom|statuscake|datadog|newrelic|prometheus",
    re.IGNORECASE,
)

# Paths we should never ping for.
_IGNORE_PREFIXES = ("/static/", "/admin", "/favicon", "/robots", "/sitemap")


class VisitorTrackerMiddleware:
    """Send one email per unique IP per 24 hours on page loads."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        try:
            self._maybe_notify(request)
        except Exception as e:  # never break the site over a notification
            log.warning("visitor tracker error: %s", e)
        return response

    def _maybe_notify(self, request):
        if request.method != "GET":
            return
        path = request.path
        if any(path.startswith(p) for p in _IGNORE_PREFIXES):
            return
        ua = request.META.get("HTTP_USER_AGENT", "")
        if not ua or _BOT_RE.search(ua):
            return
        ip = client_ip(request)
        if not ip:
            return
        cache_key = f"visit:{ip}"
        if cache.get(cache_key):
            return
        cache.set(cache_key, 1, timeout=60 * 60 * 24)  # 24 hours
        subject, html = visitor_email(request)
        send(subject, html)
