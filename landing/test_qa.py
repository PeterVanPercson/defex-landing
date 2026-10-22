"""Regression tests for the 2026-10-15 QA pass (infra, layout, error pages, forms)."""
import subprocess
import sys
from pathlib import Path
from unittest.mock import patch

from django.conf import settings
from django.template.loader import render_to_string
from django.test import SimpleTestCase, override_settings

ROOT = Path(settings.BASE_DIR)
CSS = (ROOT / "static/css/site.css").read_text()
MEET_CSS = (ROOT / "static/css/meet.css").read_text()


def media_block(css, query):
    """The body of the first @media block with exactly this query."""
    start = css.index("@media " + query + " {")
    depth, i = 0, css.index("{", start)
    for j in range(i, len(css)):
        depth += {"{": 1, "}": -1}.get(css[j], 0)
        if depth == 0:
            return css[i + 1:j]
    raise AssertionError(query)


class ContinuousIntegrationTests(SimpleTestCase):
    def test_browser_check_fails_the_build_when_an_assertion_fails(self):
        flow = (ROOT / ".github/workflows/discovery-browser.yml").read_text()
        step = flow.split("Verify the Why us page", 1)[1]
        self.assertIn("shell: bash", step)
        self.assertIn("set -euo pipefail", step)
        # the founders were taken off /why-us/ (his call), so the check no longer looks for one
        self.assertNotIn("Hasan Mavlonov", flow)
        self.assertNotIn("Founder missing", flow)
        self.assertIn("Wrong canonical", step)
        self.assertIn("application/ld+json", step)
        self.assertIn('grep -q "desktop: pass"', step)
        self.assertIn('grep -q "mobile: pass"', step)

    def test_ci_checks_every_script_and_the_generated_prototype(self):
        flow = (ROOT / ".github/workflows/ci.yml").read_text()
        self.assertIn('for f in static/js/*.js; do', flow)
        self.assertNotIn("node --check static/js/hero-film.js", flow)
        built = flow.index("npm run build:site")
        diff = flow.index("git diff --exit-code -- templates/landing/prototype.html static/prototype")
        self.assertLess(built, diff)


class AssetVersionTests(SimpleTestCase):
    def test_static_css_and_js_changes_come_with_an_asset_version_bump(self):
        """PR #128: a CSS change shipped under the old ?v= and cached browsers
        drew black shapes. static/ASSET_HASH records the version and the hash
        of static/css + static/js it was set for."""
        script = ROOT / "scripts/asset_hash.py"
        check = subprocess.run([sys.executable, str(script), "--check"], capture_output=True, text=True)
        recorded = (ROOT / "static/ASSET_HASH").read_text().split()
        self.assertEqual(
            check.returncode, 0,
            "bump DEFEX_ASSET_VERSION and update static/ASSET_HASH (python scripts/asset_hash.py)")
        self.assertEqual(recorded[0], settings.DEFEX_ASSET_VERSION,
                         "bump DEFEX_ASSET_VERSION and update static/ASSET_HASH")


@override_settings(SECURE_SSL_REDIRECT=False)
class LayoutTests(SimpleTestCase):
    def test_legal_article_holds_its_column_before_the_list_appears(self):
        """legal.js unhides the list of sections after first paint; the article
        used to auto-place into the first column and jump right (CLS 0.15)."""
        wide = media_block(CSS, "(min-width: 900px)")
        self.assertRegex(wide, r"\.legal \.prose--legal \{[^}]*grid-column: 2;[^}]*grid-row: 1;")
        self.assertRegex(wide, r"\.legal \.legal__toc \{ grid-column: 1; grid-row: 1; \}")
        page = self.client.get("/privacy/").content.decode()
        self.assertIn('<nav class="legal__toc" aria-label="On this page" hidden>', page)

    def test_claim_cards_keep_drawing_and_line_together_on_a_phone_on_its_side(self):
        side = media_block(CSS, "(orientation: landscape) and (max-height: 540px)")
        self.assertIn(".feature__body { grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); align-items: center; }", side)
        self.assertIn(".feed { height: 62svh; aspect-ratio: auto; }", side)
        # it comes after the one-column phone rules, so it wins on a landscape phone
        self.assertGreater(CSS.index("@media (orientation: landscape) and (max-height: 540px)"),
                           CSS.index(".feed { height: auto; aspect-ratio: 480 / 400; }"))

    def test_meet_fits_a_phone_on_its_side_with_the_cards_beside_the_drawing(self):
        side = media_block(MEET_CSS, "(max-width: 899px) and (orientation: landscape) and (max-height: 540px)")
        self.assertIn("--m-h: calc(100svh - 2 * var(--nav, 64px) - 8px)", side)
        self.assertIn(".meet__stage { height: var(--m-h); }", side)
        self.assertIn("grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr)", side)
        self.assertIn("flex-direction: column", side)
        script = (ROOT / "static/js/meet.js").read_text()
        # a vertical scroll of the column must not pick a card the way a sideways swipe does
        self.assertIn("|| column()) return;", script)

    def test_meet_pills_are_solid_so_the_drawing_never_reads_through(self):
        for token in ("--pill: #242429", "--pill-hi: #303036", "--pill-on: #18181C"):
            self.assertIn(token, MEET_CSS)
        self.assertIn(".meet__item { overflow: hidden; border-radius: 30px; background: var(--pill);", MEET_CSS)
        self.assertIn(".meet__item.is-on { background: var(--pill-on); }", MEET_CSS)

    def test_overscroll_past_the_home_footer_is_the_footer_colour(self):
        self.assertIn("html:has(.hero--card) { background-color: var(--page); }", CSS)
        self.assertIn("html:has(.hero--card) { animation: edge-to-footer linear both; animation-timeline: scroll(root block); }", CSS)
        self.assertIn("@keyframes edge-to-footer { 0%, 49.9% { background-color: var(--page); } 50%, 100% { background-color: #020506; } }", CSS)

    def test_paper_pages_tint_the_browser_with_the_paper(self):
        for path in ("/", "/careers/", "/careers/founding-robotics-engineer/", "/blog/",
                     "/blog/the-ai-inference-revolution-is-here/", "/privacy/", "/terms/",
                     "/security/", "/cookies/"):
            page = self.client.get(path).content.decode()
            self.assertIn('<meta name="theme-color" content="#F3EFE8">', page, path)
            self.assertNotIn("#F4F5F7", page.split("</head>", 1)[0], path)

    def test_partner_and_factory_logos_stay_small(self):
        """ath.png was 656 KB for a 64x44 mark. grand.png and michigan.png are
        already at their lossless floor at full size; shrinking them is a
        visible-quality call that is his, so they are listed, not hidden."""
        his_call = {"factories/grand.png", "partners/michigan.png"}
        for folder in ("partners", "factories"):
            for path in (ROOT / "static/img" / folder).iterdir():
                name = folder + "/" + path.name
                if name in his_call or not path.is_file():
                    continue
                self.assertLessEqual(path.stat().st_size, 60 * 1024, name)
        self.assertLessEqual((ROOT / "static/img/factories/ath.png").stat().st_size, 60 * 1024)


@override_settings(SECURE_SSL_REDIRECT=False, DEBUG=False)
class ErrorPageTests(SimpleTestCase):
    def assertSiteFace(self, page):
        self.assertIn('"Newsreader"', page)
        self.assertIn('"EB Garamond"', page)
        self.assertIn("<main", page)
        for gone in ("monospace", "Menlo", "#FF5A1F", "defexrobotics.com</a>", "&larr;"):
            self.assertNotIn(gone, page)
        self.assertIn('<a href="/">Go to the home page</a>', page)

    def test_a_missing_page_says_so_in_the_site_type(self):
        response = self.client.get("/no-such-line/")
        self.assertEqual(response.status_code, 404)
        page = response.content.decode()
        self.assertIn("<title>Page not found | Defex Robotics</title>", page)
        self.assertIn("<h1>Page not found.</h1>", page)
        self.assertNotIn("isn't on the floor", page)
        self.assertSiteFace(page)

    def test_a_server_error_never_claims_someone_was_pinged(self):
        page = render_to_string("500.html")
        self.assertIn("<title>Something went wrong | Defex Robotics</title>", page)
        self.assertIn("<h1>Something broke. Try again.</h1>", page)
        self.assertNotIn("pinged", page)
        self.assertSiteFace(page)


@override_settings(SECURE_SSL_REDIRECT=False)
class FormRedirectTests(SimpleTestCase):
    payload = {"contact": "buyer@example.com", "option": "place"}

    def setUp(self):
        # the throttle's memory is per process: keep these posts from using up
        # the allowance the other contact tests rely on
        self.addCleanup(patch.stopall)
        self.limit = patch("landing.views.rate_limited", return_value=False)
        self.limit.start()

    def test_contact_never_redirects_to_another_site(self):
        for referer in ("https://evil.example/phish", "//evil.example/", "javascript:alert(1)"):
            with patch("landing.views.send", return_value=(True, "sent")):
                response = self.client.post("/contact/", self.payload, HTTP_REFERER=referer)
            self.assertEqual(response["Location"], "/#contact", referer)
        with patch("landing.views.send", return_value=(True, "sent")):
            response = self.client.post("/contact/", self.payload)
        self.assertEqual(response["Location"], "/#contact")
        self.limit.stop()
        with patch("landing.views.rate_limited", return_value=True):
            response = self.client.post("/contact/", self.payload, HTTP_REFERER="https://evil.example/")
        self.limit.start()
        self.assertEqual(response["Location"], "/#contact")
        with patch("landing.views.send", return_value=(True, "sent")):
            response = self.client.post("/contact/", self.payload, HTTP_REFERER="http://testserver/why-us/#x")
        self.assertEqual(response["Location"], "http://testserver/why-us/#contact")

    def test_a_failed_form_names_the_sales_address_not_a_person(self):
        with patch("landing.views.send", return_value=(False, "down")), self.assertLogs("landing.views", "ERROR"):
            body = self.client.post("/contact/", self.payload, follow=True).content.decode()
        self.assertIn("sales@defexrobotics.com", body)
        self.assertNotIn("husan@", body)
        views = (ROOT / "landing/views.py").read_text()
        self.assertNotIn("husan@defexrobotics.com", views)

    def test_a_typed_apply_url_lands_on_the_form(self):
        response = self.client.get("/careers/apply/")
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], "/careers/#application")

    def test_favicon_ico_answers(self):
        response = self.client.get("/favicon.ico")
        self.assertEqual(response.status_code, 301)
        self.assertTrue(response["Location"].endswith("img/favicon-32.png"))
        self.assertTrue((ROOT / "static/img/favicon-32.png").is_file())
