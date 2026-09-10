from pathlib import Path

from django.conf import settings
from django.test import SimpleTestCase, override_settings

# The pages are fetched over plain http by the test client, and production now
# 301s that to https, so the redirect is disabled for the content tests and
# asserted on its own below.
@override_settings(SECURE_SSL_REDIRECT=False)
class SiteTests(SimpleTestCase):
    def test_pages_and_analyze(self):
        for path in ("/", "/where-it-started/", "/careers/"):
            self.assertEqual(self.client.get(path).status_code, 200)
        home = self.client.get("/")
        # the headline and the three steps must match the deck, not the
        # superseded vision-inspection positioning they replaced
        self.assertContains(home, "Robots that assemble parts")
        for step in ("Assemble", "Verify", "Recover"):
            self.assertContains(home, f">{step}</dt>")
        # the A1 cell is unbuilt and the deck labels it PROPOSED on four
        # slides, so the page must not assert it as a shipping product
        self.assertContains(home, "building")
        # the open role and the ending are load-bearing content, not decoration
        self.assertContains(home, 'id="careers"')
        self.assertContains(home, "Content Producer")
        self.assertContains(home, "/careers/")
        # the careers page carries the posting and a working application form
        careers = self.client.get("/careers/")
        for chunk in ("Content Producer", "What to include", "Build with us",
                      'id="content-producer"', 'id="application"', 'name="work"'):
            self.assertContains(careers, chunk)
        self.assertNotContains(home, ">defex<")   # mark only in the topbar
        self.assertContains(home, 'id="film"')
        self.assertContains(home, "/where-it-started/")
        self.assertNotContains(home, 'id="origin-video"')
        origin = self.client.get("/where-it-started/")
        self.assertEqual(origin.status_code, 200)
        self.assertContains(origin, 'id="origin-video"')
        self.assertContains(origin, 'id="playpause"')
        self.assertContains(origin, "started off helping factory lines")
        self.assertContains(origin, "how we learned the camera is not enough")
        for asset in ("defex/assets/defex-intro-scroll.mp4", "defex/assets/defex-intro-scroll-1080.mp4",
                      "defex/assets/defex-first-frame.webp"):
            response = self.client.get(f"/static/{asset}?v=1")
            self.assertEqual(response.status_code, 200, asset)
            self.assertIn("s-maxage", response["Cache-Control"])
        for asset in ("js/hero-film.js", "js/origin.js", "video/origin.mp4", "video/origin-poster.jpg"):
            self.assertEqual(self.client.get(f"/static/{asset}").status_code, 200, asset)

    def test_every_class_on_the_marketing_pages_is_styled(self):
        """A CSS edit that drops a rule block renders the section unstyled but
        still returns 200, so nothing else here catches it. This does."""
        import re
        root = Path(settings.BASE_DIR)
        css = (root / "static/css/site.css").read_text()
        # rules inside a media query do not style the default (desktop) case
        top = re.sub(r"@media[^{]*\{(?:[^{}]|\{[^{}]*\})*\}", "", css, flags=re.S)
        used = set()
        for name in ("home.html", "origin.html", "_topbar.html"):
            markup = (root / "templates/landing" / name).read_text()
            for attr in re.findall(r'class="([^"]*)"', markup):
                used |= {c for c in attr.split() if re.fullmatch(r"[a-z][a-z0-9_-]*", c)}
        # set by JS, by Django message tags, or intentionally unstyled wrappers
        dynamic = {"has-scroll-film", "form__flash--error", "contact__intro"}
        for name in sorted(used - dynamic):
            # a whole selector, so .kicker__dash cannot satisfy a check for .kicker
            token = re.compile(rf"\.{re.escape(name)}(?![\w-])")
            self.assertRegex(css, token, f".{name} has no rule at all")
            self.assertRegex(top, token, f".{name} is only styled inside a media query")

    def test_crawl_surface(self):
        robots = self.client.get("/robots.txt")
        self.assertEqual(robots.status_code, 200)
        self.assertIn("text/plain", robots["Content-Type"])
        self.assertIn("Sitemap: http://testserver/sitemap.xml", robots.content.decode())

        sitemap = self.client.get("/sitemap.xml")
        self.assertEqual(sitemap.status_code, 200)
        self.assertIn("xml", sitemap["Content-Type"])
        body = sitemap.content.decode()
        for path in ("/", "/where-it-started/", "/careers/"):
            self.assertIn(f"<loc>http://testserver{path}</loc>", body)

        # the demo page was unreachable from the site for weeks; keep it linked
        home = self.client.get("/").content.decode()

        # the founder link must stay bidirectional with husanmavlonov.com
        self.assertIn("https://husanmavlonov.com/#person", home)
        self.assertIn("https://defex.app/#org", home)


class SecurityTests(SimpleTestCase):
    """Guards the hardening itself. Each of these was a finding once."""

    @override_settings(SECURE_SSL_REDIRECT=True)
    def test_django_honours_the_ssl_redirect(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 301)
        self.assertTrue(response["Location"].startswith("https://"))

    def test_production_actually_turns_the_hardening_on(self):
        """The test above only proves Django obeys the flag. This proves the
        flag is set, which is the part that can regress. Evaluated the way a
        production process would: DEBUG off, key present."""
        import os, runpy
        env = dict(os.environ, DEBUG="False", SECRET_KEY="x" * 60)
        old, os.environ = os.environ, env
        try:
            ns = runpy.run_path(str(Path(settings.BASE_DIR) / "config" / "settings.py"))
        finally:
            os.environ = old
        self.assertFalse(ns["DEBUG"])
        for flag in ("SECURE_SSL_REDIRECT", "SESSION_COOKIE_SECURE",
                     "CSRF_COOKIE_SECURE", "SESSION_COOKIE_HTTPONLY",
                     "SECURE_HSTS_INCLUDE_SUBDOMAINS"):
            self.assertTrue(ns.get(flag), f"{flag} is not on in production")
        self.assertGreaterEqual(ns.get("SECURE_HSTS_SECONDS", 0), 86400)
        self.assertNotIn(".onrender.com", ns["ALLOWED_HOSTS"])

    def test_secret_key_has_no_committed_fallback(self):
        """The old default was a literal in a public repo. Serving without a
        key must raise rather than quietly sign with something readable."""
        source = (Path(settings.BASE_DIR) / "config" / "settings.py").read_text()
        self.assertNotIn("django-insecure-change-this-in-production", source)
        self.assertIn("ImproperlyConfigured", source)

    def test_autoresponder_is_off_unless_explicitly_enabled(self):
        """It mails an address the visitor supplies, from a Defex domain. It
        stays off until a captcha is on the form."""
        source = (Path(settings.BASE_DIR) / "config" / "settings.py").read_text()
        self.assertIn('os.getenv("AUTORESPONDER", "0") == "1"', source)

    def test_mail_endpoints_are_rate_limited(self):
        from landing.throttle import rate_limited
        ident = "203.0.113.7"
        allowed = sum(0 if rate_limited("t", ident, 3, 60) else 1 for _ in range(5))
        self.assertEqual(allowed, 3, "the 4th and 5th call should be limited")
