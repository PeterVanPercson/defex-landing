from pathlib import Path

from django.conf import settings
from django.test import SimpleTestCase

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
