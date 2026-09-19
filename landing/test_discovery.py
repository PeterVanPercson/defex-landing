"""Regressions for public identity and search accessibility, without a database."""
import json
import re
from urllib.parse import urlsplit
from urllib.robotparser import RobotFileParser
from xml.etree import ElementTree as ET

from django.test import SimpleTestCase, override_settings
from django.urls import reverse

from .discovery import CANONICAL_ORIGIN, COMPANY_UPDATED, PUBLIC_COMPANY


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver", "preview.vercel.app", "defexrobotics.com"])
class DiscoverabilityTests(SimpleTestCase):
    def get_page(self, path):
        response = self.client.get(path)
        self.assertEqual(response.status_code, 200)
        return response.content.decode()

    def graphs(self, html):
        docs = [json.loads(value) for value in re.findall(r'<script type="application/ld\+json">\s*(.*?)\s*</script>', html, re.S)]
        return [node for doc in docs for node in doc.get("@graph", [doc])]

    def test_company_page_and_contact(self):
        page = self.get_page("/company/")
        for text in ("21 factories paid to be first", "paid waitlist", "assembly cell is in development", "Husan Mavlonov", "Hasan Mavlonov", "mailto:husan@defexrobotics.com"):
            self.assertIn(text, page)

    def test_company_json_is_public_subset_not_a_data_room(self):
        response = self.client.get("/company.json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), PUBLIC_COMPANY)
        self.assertEqual(response["X-Robots-Tag"], "noindex")
        self.assertIn(CANONICAL_ORIGIN + "/company/", response["Link"])
        for word in ("a16z", "Domino", "Khosla", "26000", "ARR", "investors", "commitment"):
            self.assertNotIn(word, response.content.decode())

    def test_both_founders_are_distinct_from_organization(self):
        nodes = self.graphs(self.get_page("/company/"))
        org = next(node for node in nodes if node["@type"] == "Organization")
        people = {node["@id"]: node for node in nodes if node["@type"] == "Person"}
        self.assertEqual({people[item["@id"]]["name"] for item in org["founder"]}, {"Husan Mavlonov", "Hasan Mavlonov"})
        self.assertNotIn("sameAs", org)
        self.assertNotIn("funding", org)
        self.assertNotIn("knowsAbout", org)
        self.assertIn("https://www.linkedin.com/in/husan-mavlonov", people["https://husanmavlonov.com/#person"]["sameAs"])

    def test_every_existing_indexable_page_has_valid_jsonld_and_canonical(self):
        paths = ["/", "/company/", "/careers/", "/why-us/", "/blog/", "/blog/the-cost-of-the-next-attempt/", "/blog/the-ai-inference-revolution-is-here/"]
        for path in paths:
            with self.subTest(path=path):
                page = self.get_page(path)
                self.assertTrue(self.graphs(page))
                self.assertIn('rel="canonical" href="' + CANONICAL_ORIGIN + path + '"', page)
                self.assertIn('property="og:url" content="' + CANONICAL_ORIGIN + path + '"', page)

    def test_canonical_ignores_query_and_preview_host(self):
        response = self.client.get("/company/?utm_source=linkedin", HTTP_HOST="preview.vercel.app")
        self.assertContains(response, 'rel="canonical" href="https://defexrobotics.com/company/"')
        self.assertNotIn("preview.vercel.app", response.content.decode())
        self.assertNotIn("utm_source=linkedin", response.content.decode())

    def test_company_is_in_sitemap_once(self):
        root = ET.fromstring(self.get_page("/sitemap.xml"))
        ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        urls = [node.text for node in root.findall("s:url/s:loc", ns)]
        self.assertIn(CANONICAL_ORIGIN + "/company/", urls)
        self.assertEqual(len(urls), len(set(urls)))
        self.assertNotIn(CANONICAL_ORIGIN + "/company.json", urls)
        for url in urls:
            self.assertEqual(urlsplit(url).netloc, "defexrobotics.com")
            self.assertEqual(self.client.get(urlsplit(url).path).status_code, 200)

    def test_sitemap_never_uses_request_hostname(self):
        response = self.client.get("/sitemap.xml", HTTP_HOST="preview.vercel.app")
        self.assertNotIn("preview.vercel.app", response.content.decode())
        self.assertIn(CANONICAL_ORIGIN, response.content.decode())

    def test_sitemap_omits_unknown_lastmod(self):
        root = ET.fromstring(self.get_page("/sitemap.xml"))
        ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        entries = {node.find("s:loc", ns).text: node for node in root.findall("s:url", ns)}
        for path in ("/", "/careers/", "/blog/"):
            self.assertIsNone(entries[CANONICAL_ORIGIN + path].find("s:lastmod", ns))
        self.assertEqual(entries[CANONICAL_ORIGIN + "/company/"].find("s:lastmod", ns).text, COMPANY_UPDATED.isoformat())

    def test_crawlers_can_read_public_content_but_not_submission_routes(self):
        parser = RobotFileParser()
        parser.parse(self.get_page("/robots.txt").splitlines())
        for agent in ("Googlebot", "Bingbot", "YandexBot", "OAI-SearchBot", "ChatGPT-User", "ExampleBot"):
            for path in ("/", "/company/", "/blog/", "/careers/"):
                self.assertTrue(parser.can_fetch(agent, CANONICAL_ORIGIN + path), (agent, path))
            for path in ("/contact/", "/careers/apply/", "/ping/", "/admin/"):
                self.assertFalse(parser.can_fetch(agent, CANONICAL_ORIGIN + path), (agent, path))
        self.assertEqual(parser.site_maps(), [CANONICAL_ORIGIN + "/sitemap.xml"])

    def test_head_requests_are_supported(self):
        for name in ("company", "company_json", "robots", "sitemap"):
            response = self.client.head(reverse(name))
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.content, b"")

    def test_read_only_discovery_routes_reject_post(self):
        for path in ("/company/", "/company.json", "/robots.txt", "/sitemap.xml"):
            self.assertEqual(self.client.post(path).status_code, 405)

    def test_husan_is_cofounder_everywhere(self):
        for path in ("/", "/company/", "/careers/", "/why-us/", "/blog/", "/blog/the-cost-of-the-next-attempt/", "/llms.txt"):
            page = self.get_page(path)
            self.assertIsNone(re.search(r"(?<![Cc]o-)(?<![Cc]o)\b[Ff]ounder (of|and|&|profile)", page), path)
        self.assertIn("Co-founder and CEO of Defex", self.get_page("/blog/the-cost-of-the-next-attempt/"))

    def test_careers_has_a_google_jobs_posting(self):
        jobs = [node for node in self.graphs(self.get_page("/careers/")) if node.get("@type") == "JobPosting"]
        self.assertEqual(len(jobs), 1)
        job = jobs[0]
        for key in ("title", "description", "datePosted", "hiringOrganization", "jobLocation", "employmentType"):
            self.assertTrue(job.get(key), key)
        self.assertEqual(job["hiringOrganization"]["@id"], CANONICAL_ORIGIN + "/#org")

    def test_llms_txt_lists_canonical_pages(self):
        body = self.get_page("/llms.txt")
        self.assertTrue(body.startswith("# Defex\n"))
        for url in ("/company/", "/careers/", "/why-us/", "/blog/the-cost-of-the-next-attempt/", "/blog/feed.xml"):
            self.assertIn(CANONICAL_ORIGIN + url, body)
        self.assertNotIn("defex.app/", body)

    def test_investors_page_invites_email_and_is_discoverable(self):
        page = self.get_page("/investors/")
        self.assertIn("$1.5M", page)
        self.assertIn('href="mailto:husan@defexrobotics.com?subject=Defex%20pre-seed"', page)
        self.assertIn(CANONICAL_ORIGIN + "/investors/", page)
        for word in ("Domino", "Khosla", "valuation", "cap"):
            self.assertNotIn(word, re.sub(r"<script.*?</script>|<[^>]+>", " ", page, flags=re.S), word)
        for path in ("/", "/company/", "/careers/", "/blog/", "/blog/the-cost-of-the-next-attempt/"):
            self.assertIn('href="/investors/"', self.get_page(path), path)
        self.assertIn(CANONICAL_ORIGIN + "/investors/", self.get_page("/sitemap.xml"))
        self.assertIn(CANONICAL_ORIGIN + "/investors/", self.get_page("/llms.txt"))
