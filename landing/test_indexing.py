"""IndexNow exposes only a domain-separated public ownership proof."""
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings


@override_settings(SECURE_SSL_REDIRECT=False)
class IndexNowTests(SimpleTestCase):
    def test_key_is_stable_and_noindex(self):
        with override_settings(SECRET_KEY="example-private-signing-key"):
            response = self.client.get("/indexnow-key.txt")
            self.assertEqual(response.status_code, 200)
            self.assertRegex(response.content.decode(), r"^[a-f0-9]{64}$")
            self.assertEqual(response["X-Robots-Tag"], "noindex")
            self.assertEqual(response.content, self.client.get("/indexnow-key.txt").content)
            self.assertNotIn(b"example-private-signing-key", response.content)
        with override_settings(SECRET_KEY="different-private-signing-key"):
            self.assertNotEqual(response.content, self.client.get("/indexnow-key.txt").content)

    def test_key_does_not_accept_posts_or_enter_sitemap(self):
        self.assertEqual(self.client.head("/indexnow-key.txt").status_code, 200)
        self.assertEqual(self.client.post("/indexnow-key.txt").status_code, 405)
        self.assertNotIn(b"indexnow-key", self.client.get("/sitemap.xml").content)

    def test_production_revision_is_available_for_deployment_gate(self):
        revision = "a" * 40
        with patch.dict("os.environ", {"VERCEL_GIT_COMMIT_SHA": revision}):
            self.assertEqual(self.client.get("/company.json")["X-Defex-Revision"], revision)

    def test_blog_links_to_company_without_touching_homepage(self):
        self.assertContains(self.client.get("/blog/"), 'href="/company/">Company</a>')
