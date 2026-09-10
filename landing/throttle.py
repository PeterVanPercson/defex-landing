"""Per-IP rate limiting for the endpoints that send mail.

Every form on this site turns one HTTP request into one outbound email, which
makes them worth money to abuse: Resend quota, inbox flooding, and (when the
autoresponder is enabled) mail to a third party from a Defex domain.

This is a speed bump, not a lock. Django's default cache is per-process
LocMemCache, and on Vercel each warm instance has its own memory, so a
distributed flood spread across instances is not stopped. It does stop the
cheap case: one script hammering one endpoint. The real control for the
third-party path is that AUTORESPONDER defaults to off.

Wire a shared cache (Redis/Upstash) into CACHES and this becomes a real global
limit with no code change.
"""
from __future__ import annotations

import time

from django.core.cache import cache


def rate_limited(scope: str, ident: str, limit: int, window: int) -> bool:
    """True when this identity has already used up `limit` calls in `window`.

    Fixed window, so the worst case is 2x the limit across a boundary. That is
    fine for abuse control and avoids the bookkeeping a sliding window needs.
    Never raises: a cache backend that is down must not take the form down with
    it, so any failure fails open.
    """
    if limit <= 0:
        return False
    bucket = f"rl:{scope}:{ident}:{int(time.time() // window)}"
    try:
        if cache.add(bucket, 1, window + 5):
            return False
        return cache.incr(bucket) > limit
    except Exception:
        return False


def client_ident(request) -> str:
    """Identity to throttle on.

    Vercel and Render both overwrite X-Forwarded-For with the real client IP
    rather than appending to a client-supplied one, so the first hop is
    trustworthy behind those proxies. Direct-to-origin traffic could spoof it,
    which is another reason this is a speed bump rather than a guarantee.
    """
    fwd = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if fwd:
        return fwd.split(",")[0].strip()[:45]
    return request.META.get("REMOTE_ADDR", "")[:45] or "unknown"
