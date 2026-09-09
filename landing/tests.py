import json
from pathlib import Path

from django.conf import settings
from unittest.mock import Mock, patch

import requests
from django.core.cache import cache
from django.test import Client, SimpleTestCase, override_settings

from .quality_review import FIELDS, ReviewError, generate_report, summarize
from .review_views import sample_text


@override_settings(NEBIUS_API_KEY="test-only", NEBIUS_MODEL="test-model",
                   REVIEW_ENABLED=True, REVIEW_ACCESS_CODE="private-code")
class QualityReviewTests(SimpleTestCase):
    def setUp(self):
        cache.clear()

    def post(self, path, data):
        return self.client.post("/quality-review/" + path + "/",
                                data=json.dumps(data), content_type="application/json")

    def test_sample_counts(self):
        for name in ("clean-run", "defect-spike", "uncertain"):
            summary = summarize(sample_text(name))
            self.assertEqual(summary["inspected"], 60)
            self.assertEqual(summary["facts"][0]["failed"], summary["failed"])
        self.assertEqual(summarize(sample_text("clean-run"))["failed"], 0)
        self.assertGreater(summarize(sample_text("uncertain"))["missing_confidence"], 0)

    def test_invalid_csv(self):
        for text in ("", "wrong,columns\n1,2", ",".join(FIELDS) + '\n"unterminated',
                     ",".join(FIELDS) + "\n" + "x" * 140000):
            with self.subTest(text=text[:30]), self.assertRaises(ReviewError):
                summarize(text)

    def test_invalid_timestamp_and_confidence(self):
        for stamp, confidence in (("bad", ".9"), ("2026-09-05T08:00:00", ".9"),
                                  ("2026-09-05T08:00:00Z", "NaN"),
                                  ("2026-09-05T08:00:00Z", "1.1")):
            with self.assertRaises(ReviewError):
                summarize(",".join(FIELDS) + f"\n{stamp},A,PASS,,{confidence}")

    def test_pages_and_analyze(self):
        for path in ("/", "/where-it-started/", "/quality-review/"):
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
        self.assertContains(home, "Mechanical design and machine controls")
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
        response = self.post("analyze", {"sample_id": "defect-spike"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["summary"]["inspected"], 60)
        self.assertEqual(self.post("analyze", []).status_code, 400)

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
        for path in ("/", "/where-it-started/", "/quality-review/"):
            self.assertIn(f"<loc>http://testserver{path}</loc>", body)

        # the demo page was unreachable from the site for weeks; keep it linked
        home = self.client.get("/").content.decode()
        self.assertIn("/quality-review/", home)

        # the founder link must stay bidirectional with husanmavlonov.com
        self.assertIn("https://husanmavlonov.com/#person", home)
        self.assertIn("https://defex.app/#org", home)

    def test_csrf(self):
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(client.post("/quality-review/analyze/",
                                    data="{}", content_type="application/json").status_code, 403)
        client.get("/quality-review/")
        response = client.post("/quality-review/analyze/",
                               data=json.dumps({"sample_id": "clean-run"}),
                               content_type="application/json",
                               HTTP_X_CSRFTOKEN=client.cookies["csrftoken"].value)
        self.assertEqual(response.status_code, 200)

    @patch("landing.review_views.generate_report")
    def test_consent_and_custom_access(self, generate):
        self.assertEqual(self.post("generate", {"sample_id": "clean-run"}).status_code, 400)
        data = {"csv": sample_text("clean-run"), "consent": True}
        self.assertEqual(self.post("generate", data).status_code, 403)
        generate.assert_not_called()
        generate.return_value = {"measurement": {"cached": False}}
        self.assertEqual(self.post("generate", {**data, "access_code": "private-code"}).status_code, 200)
        generate.assert_called_once()

    @override_settings(NEBIUS_API_KEY="")
    def test_missing_configuration(self):
        self.assertEqual(self.post("generate", {"sample_id": "clean-run", "consent": True}).status_code, 503)
        with self.assertRaises(ReviewError):
            generate_report(summarize(sample_text("clean-run")))

    @patch("landing.quality_review.requests.post")
    def test_provider_failures(self, post):
        summary = summarize(sample_text("clean-run"))
        post.side_effect = requests.Timeout()
        with self.assertRaises(ReviewError):
            generate_report(summary)
        post.side_effect = None
        for status in (401, 429, 500):
            post.return_value = Mock(status_code=status)
            with self.assertRaises(ReviewError):
                generate_report(summary)
        for body in ([], {}, {"choices": [None]}, {"choices": [{"message": None, "finish_reason": "stop"}]},
                     {"choices": [{"finish_reason": "stop", "message": {"content": "{}"}}]}):
            post.return_value = Mock(status_code=200)
            post.return_value.json.return_value = body
            with self.assertRaises(ReviewError):
                generate_report(summary)
