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
        self.assertContains(home, "Self-teaching robots")
        # three claims, each a benefit with the mechanism in its second sentence
        for claim in ("Robots you can walk away from.",
                      "Our robots feel what&rsquo;s wrong.",
                      "A new way, not a new project."):
            self.assertContains(home, f'class="feature__t engraved">{claim}</h3>')
        # the section is "Why us", not the old slogan
        self.assertContains(home, 'id="why-title" data-reveal>Why <em>us</em></h2>')
        self.assertNotContains(home, "the test becomes the teacher")
        # the hero has to say what the machine does and ask for something
        self.assertContains(home, 'href="#contact"')
        # the calendar is the action; the form is the fallback, one line under it
        self.assertContains(home, '<details class="note contact__inner">')
        self.assertContains(home, 'name="factory"')
        # the hero is the headline and the film, nothing else competing with it
        self.assertNotContains(home, "lede__sub")
        # nothing promises monotonic improvement
        self.assertNotContains(home, "The next one is better")
        # the first application is named, not left abstract
        self.assertContains(home, "connector")
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
        # the topbar carries the mark alone; the wordmark belongs to the
        # footer, so this has to look at the header and not the whole page
        header = home.content.decode().split("<header", 1)[1].split("</header>", 1)[0]
        self.assertNotIn(">defex<", header)
        self.assertIn(">defex<", home.content.decode())   # present in the footer
        self.assertContains(home, 'id="film"')
        # the starting page: overlay markup, its head gate and its script
        self.assertContains(home, 'id="intro"')
        self.assertContains(home, "intro__particle--core")
        self.assertContains(home, "classList.add('is-intro')")
        self.assertContains(home, 'src="/static/js/intro.js')
        self.assertContains(home, "/where-it-started/")
        # the origin clip now runs on the home page too, under the hero
        self.assertContains(home, 'id="origin-video"')
        # the clip loops rather than freezing on its last frame
        self.assertContains(home, 'id="origin-video" muted loop')
        # no example text in the part field
        self.assertNotContains(home, 'placeholder="e.g.')
        self.assertContains(home, "js/origin.js")
        self.assertContains(home, "That is how we learned the camera is not enough")
        origin = self.client.get("/where-it-started/")
        self.assertEqual(origin.status_code, 200)
        self.assertContains(origin, 'id="origin-video"')
        self.assertContains(origin, 'id="playpause"')
        self.assertContains(origin, "started off helping factory lines")
        self.assertContains(origin, "how we learned the camera is not enough")
        self.assertContains(home, 'data-fps="60"')
        self.assertContains(home, "defex-intro-v4.mp4")
        self.assertContains(home, "defex-poster-v4.webp")
        # every superseded hero asset, so a revert to one of them is caught
        for gone in ("defex-intro-scroll-v2.webm", "defex-intro-scroll.mp4",
                     "defex-intro-scroll-1080.mp4", "defex-first-frame.webp",
                     "defex-first-frame-v2.webp", "defex-final-frame.webp",
                     "defex-final-frame-v2.webp", "defex-intro-v3.mp4",
                     "defex-poster-v3.webp"):
            self.assertNotContains(home, gone)
        for asset in ("defex/assets/defex-intro-v4.mp4",
                      "defex/assets/defex-intro-v4-sm.mp4",
                      "defex/assets/defex-poster-v4.webp",
                      "defex/assets/defex-poster-final-v4.webp"):
            response = self.client.get(f"/static/{asset}?v=1")
            self.assertEqual(response.status_code, 200, asset)
            self.assertIn("s-maxage", response["Cache-Control"])
        for asset in ("js/hero-film.js", "js/intro.js", "js/origin.js", "js/reveal.js", "video/origin.mp4", "video/origin-poster.jpg"):
            self.assertEqual(self.client.get(f"/static/{asset}").status_code, 200, asset)

    def test_hero_supports_byte_ranges(self):
        """Scroll seeking needs partial responses at both ends of the film."""
        path = "defex/assets/defex-intro-v4.mp4"
        size = (Path(settings.BASE_DIR) / "static" / path).stat().st_size
        for start in (0, size - 1024):
            response = self.client.get(
                f"/static/{path}", HTTP_RANGE=f"bytes={start}-{start + 1023}"
            )
            try:
                self.assertEqual(response.status_code, 206)
                self.assertEqual(response["Content-Type"], "video/mp4")
                self.assertEqual(response["Content-Range"], f"bytes {start}-{start + 1023}/{size}")
                self.assertEqual(len(b"".join(response.streaming_content)), 1024)
            finally:
                response.close()

    def test_contact_never_reports_success_when_the_email_failed(self):
        """There is no database here, so a dropped notification is a lost
        enquiry. Telling the visitor it worked is the worst possible outcome:
        they stop chasing and nobody ever sees it."""
        from unittest.mock import patch
        payload = {"name": "A Buyer", "factory": "A Factory",
                   "contact": "buyer@example.com", "product": "12-pin connector"}
        with patch("landing.views.send", return_value=(False, "resend 500")) as sent:
            with self.assertLogs("landing.views", level="ERROR") as logged:
                response = self.client.post("/contact/", payload, follow=True)
            self.assertTrue(sent.called)
        body = response.content.decode()
        self.assertNotIn("We reply within one working day", body)
        self.assertIn("did not send", body)
        # the form lives behind a disclosure, so it has to open on its own when
        # a submission comes back, or the visitor never sees the message
        self.assertIn('<details class="note contact__inner" open>', body)
        # and the submission itself is in the log, so it is recoverable by hand
        self.assertIn("A Factory", "".join(logged.output))

        with patch("landing.views.send", return_value=(True, "sent")):
            response = self.client.post("/contact/", payload, follow=True)
        self.assertIn("We reply within one working day", response.content.decode())

    def test_every_page_can_reach_the_contact_form(self):
        """The nav button rendered #contact on /careers/, where there is no
        contact section, so it went nowhere."""
        for path in ("/careers/", "/where-it-started/"):
            body = self.client.get(path).content.decode()
            header = body.split("<header", 1)[1].split("</header>", 1)[0]
            self.assertIn('href="/#contact"', header, path)
        home_header = self.client.get("/").content.decode().split("<header", 1)[1].split("</header>", 1)[0]
        self.assertIn('href="#contact"', home_header)

    def test_booker_is_on_the_home_page(self):
        """It lives at #contact, not on a page of its own: that is where someone
        has finished reading, and a second page is one more click before a slot."""
        body = self.client.get("/").content.decode()
        self.assertIn('id="cal-inline"', body)
        self.assertIn('data-cal="husan-mavlonov-qxqy1a/30min"', body)
        self.assertIn("js/book.js", body)
        self.assertIn("Test our <em>product</em>", body)
        # nothing competing with the calendar underneath it
        self.assertNotIn("Calendar not loading", body)
        self.assertNotIn("What happens next", body)

        # the event is env-overridable, so it can be renamed without a deploy
        with override_settings(CAL_LINK="defex/product-test"):
            body = self.client.get("/").content.decode()
        self.assertIn('data-cal="defex/product-test"', body)

        # cal.com injects `.cal-embed { color-scheme: unset !important }`; without
        # an !important override the frame inherits our dark scheme and Chrome
        # paints it opaque white under their branding. Do not "clean this up".
        css = (Path(settings.BASE_DIR) / "static/css/site.css").read_text()
        self.assertRegex(css, r"\.booker__frame iframe \{[^}]*color-scheme:\s*light !important")

        # /book/ was live and indexed, so it redirects rather than 404s
        moved = self.client.get("/book/")
        self.assertEqual(moved.status_code, 301)
        self.assertEqual(moved["Location"], "/#contact")
        self.assertNotIn("/book/", self.client.get("/sitemap.xml").content.decode())

    def test_hero_assets_stay_within_budget(self):
        """The hero shipped at 34.5MB once, on every device, with no narrow
        build and nothing in CI that noticed. A visitor on a phone pays for
        this before they read a word, so it gets a number and a guard. The cap
        is generous on purpose: the film stays 1920x1080 at 60fps, and the way
        to stay under it is the GOP, not the resolution or the frame rate."""
        budget = {
            "defex-intro-v4.mp4": 14 * 1024 * 1024,
            "defex-intro-v4-sm.mp4": 8 * 1024 * 1024,
            "defex-poster-v4.webp": 90 * 1024,
            "defex-poster-final-v4.webp": 90 * 1024,
        }
        assets = Path(settings.BASE_DIR) / "static" / "defex" / "assets"
        for name, cap in budget.items():
            size = (assets / name).stat().st_size
            self.assertLessEqual(size, cap, f"{name} is {size / 1048576:.1f}MB")
        # the phone build has to actually be smaller, or it is pointless
        self.assertLess((assets / "defex-intro-v4-sm.mp4").stat().st_size,
                        (assets / "defex-intro-v4.mp4").stat().st_size)
        # nothing superseded is still sitting in the deployed tree
        shipped = {p.name for p in assets.iterdir() if p.is_file()}
        self.assertEqual(shipped, set(budget))

    def test_share_card_is_current(self):
        """Every page's og:image is the same file, it is what a link pastes
        into Telegram or LinkedIn, and it stayed on the superseded 'ultra
        inspection' positioning for months because nothing looked at it."""
        card = Path(settings.BASE_DIR) / "static" / "img" / "og.jpg"
        self.assertTrue(card.exists())
        self.assertLessEqual(card.stat().st_size, 300 * 1024)
        for path in ("/", "/where-it-started/", "/careers/"):
            body = self.client.get(path).content.decode()
            self.assertIn('property="og:image" content="https://defex.app/static/img/og.jpg?v=', body)
            self.assertIn('name="twitter:image" content="https://defex.app/static/img/og.jpg?v=', body)

    def test_every_class_on_the_marketing_pages_is_styled(self):
        """A CSS edit that drops a rule block renders the section unstyled but
        still returns 200, so nothing else here catches it. This does."""
        import re
        root = Path(settings.BASE_DIR)
        css = (root / "static/css/site.css").read_text()
        # rules inside a media query do not style the default (desktop) case
        top = re.sub(r"@media[^{]*\{(?:[^{}]|\{[^{}]*\})*\}", "", css, flags=re.S)
        # the intro is a fixed overlay: it must stay hidden until JS opts in,
        # and stay hidden for reduced-motion visitors whatever JS does
        self.assertRegex(top, r"\.intro \{[^}]*display: none;", ".intro must be hidden until JS opts in")
        self.assertIn(".intro { display: none !important; }", css.split("prefers-reduced-motion", 1)[1],
                      "reduced motion must hide the intro")
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
