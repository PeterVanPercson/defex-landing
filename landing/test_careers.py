import json
import re
from unittest.mock import patch

from django.test import Client, SimpleTestCase, override_settings

from .jobs import JOBS, job_path


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["testserver"])
class CareersTests(SimpleTestCase):
    def setUp(self):
        self.mail = patch("landing.views.send", return_value=(True, "sent")).start()
        self.rate = patch("landing.views.rate_limited", return_value=False).start()
        self.addCleanup(patch.stopall)
        self.data = {
            "name": 'Engineer <"Example">',
            "email": "applicant@example.com",
            "role": "founding-robotics-engineer",
            "work": "https://example.com/robot",
            "note": "I built and commissioned the control system for this robot.",
        }

    def test_all_jobs_are_reachable_from_home_listing_and_sitemap(self):
        for page in ("/", "/careers/", "/sitemap.xml"):
            response = self.client.get(page)
            self.assertEqual(response.status_code, 200)
            for job in JOBS:
                self.assertIn(job_path(job), response.content.decode())
        self.assertEqual(self.client.get("/careers/closed-role/").status_code, 404)

    def test_each_job_has_accurate_schema_and_a_preselected_application(self):
        for job in JOBS:
            with self.subTest(job=job["slug"]):
                response = self.client.get(job_path(job))
                html = response.content.decode()
                self.assertEqual(response.context["form"]["role"].value(), job["slug"])
                docs = [json.loads(text) for text in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)]
                postings = [doc for doc in docs if doc.get("@type") == "JobPosting"]
                self.assertEqual(len(postings), 1)
                posting = postings[0]
                self.assertEqual(posting["employmentType"], job["employment_type"])
                self.assertEqual(posting["baseSalary"]["value"]["minValue"], job["pay_min"])
                self.assertEqual(posting["baseSalary"]["value"]["maxValue"], job["pay_max"])
                self.assertEqual(posting["baseSalary"]["value"]["unitText"], job["pay_unit"])
                self.assertIn(job["compensation"], posting["description"])
                self.assertEqual(posting["url"], "https://defexrobotics.com" + job_path(job))
                self.assertContains(response, 'id="' + job["slug"] + '" open')
                self.assertEqual(self.client.head(job_path(job)).status_code, 200)

    def test_role_query_preselects_without_reflecting_unknown_input(self):
        response = self.client.get("/careers/?role=robot-learning-engineer")
        self.assertEqual(response.context["form"]["role"].value(), "robot-learning-engineer")
        response = self.client.get("/careers/", {"role": '<script>alert("invalid")</script>'})
        self.assertIsNone(response.context["form"]["role"].value())
        self.assertNotContains(response, 'alert("invalid")')

    def test_each_role_sends_the_correct_label_and_escaped_application(self):
        for job in JOBS:
            with self.subTest(job=job["slug"]):
                self.mail.reset_mock()
                response = self.client.post("/careers/apply/", {**self.data, "role": job["slug"]})
                self.assertEqual(response.status_code, 302)
                self.assertEqual(response.url, "/careers/?role=" + job["slug"] + "#application")
                self.mail.assert_called_once()
                subject, html = self.mail.call_args.args
                self.assertIn(job["title"], subject)
                self.assertIn("Engineer &lt;&quot;Example&quot;&gt;", html)
                self.assertNotIn(self.data["name"], html)

    def test_invalid_application_retains_fields_and_exposes_field_error(self):
        response = self.client.post("/careers/apply/", {**self.data, "email": "invalid", "role": "robot-learning-engineer"})
        self.assertEqual(response.status_code, 400)
        self.mail.assert_not_called()
        form = response.context["form"]
        for field in ("name", "work", "note"):
            self.assertEqual(form[field].value(), self.data[field])
        self.assertEqual(form["role"].value(), "robot-learning-engineer")
        self.assertContains(response, 'aria-describedby="email-error"', status_code=400)
        self.assertContains(response, "Engineer &lt;&quot;Example&quot;&gt;", status_code=400)

    def test_a_substantive_private_project_description_can_replace_a_link(self):
        response = self.client.post("/careers/apply/", {**self.data, "work": ""})
        self.assertEqual(response.status_code, 302)
        self.mail.assert_called_once()

    def test_missing_evidence_invalid_urls_and_unknown_roles_do_not_send(self):
        for values in ({"work": "", "note": "short"}, {"work": "not-a-url"}, {"role": "ceo"}):
            with self.subTest(values=values):
                response = self.client.post("/careers/apply/", {**self.data, **values})
                self.assertEqual(response.status_code, 400)
        self.mail.assert_not_called()

    def test_provider_failure_keeps_the_application_and_displays_email_fallback(self):
        self.mail.return_value = False, "provider unavailable"
        with self.assertLogs("landing.views", level="ERROR"):
            response = self.client.post("/careers/apply/", self.data)
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.context["form"]["note"].value(), self.data["note"])
        self.assertContains(response, "That did not send.", status_code=503)
        self.assertNotContains(response, "Got it.", status_code=503)

    def test_throttling_keeps_the_application_without_sending(self):
        self.rate.return_value = True
        response = self.client.post("/careers/apply/", self.data)
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.context["form"]["work"].value(), self.data["work"])
        self.mail.assert_not_called()

    def test_csrf_honeypot_and_post_only_submission_remain_enforced(self):
        self.assertEqual(Client(enforce_csrf_checks=True).post("/careers/apply/", self.data).status_code, 403)
        self.assertEqual(self.client.get("/careers/apply/").status_code, 405)
        self.assertEqual(self.client.post("/careers/apply/", {**self.data, "website": "bot.example"}).status_code, 400)
        self.mail.assert_not_called()
