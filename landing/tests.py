from pathlib import Path

from django.conf import settings
from django.test import SimpleTestCase, override_settings

# The pages are fetched over plain http by the test client, and production now
# 301s that to https, so the redirect is disabled for the content tests and
# asserted on its own below.
@override_settings(SECURE_SSL_REDIRECT=False)
class SiteTests(SimpleTestCase):
    def test_pages_and_analyze(self):
        for path in ("/", "/careers/"):
            self.assertEqual(self.client.get(path).status_code, 200)
        home = self.client.get("/")
        # the headline and the three steps must match the deck, not the
        # superseded vision-inspection positioning they replaced
        self.assertContains(home, "Self-teaching robots")
        # the case in the pitch's own words: what it does for a factory, as ruled rows
        for claim in ("Our robot teaches itself.", "Bad parts never ship.",
                      "No one stands over it.", "A new part is not a new project."):
            self.assertContains(home, f'class="feature__t engraved">{claim}</h3>')
        for slop in ("walk away from", "feel what", "A new way, not a new project", "harder to fixture"):
            self.assertNotContains(home, slop)
        # the section is "Why us", not the old slogan
        self.assertContains(home, 'id="why-title" data-reveal>Robots are cheap. Setting them up is <em>not</em>.</h2>')
        self.assertNotContains(home, "the test becomes the teacher")
        page = home.content.decode()
        self.assertEqual(page.count('alt="a16z"'), 1)
        self.assertIn('class="lede__backed"', page)
        self.assertLess(page.index('class="lede__backed"'), page.index('id="origin"'))
        self.assertNotIn('class="marquee', page)
        self.assertNotIn("marquee__", page)
        self.assertNotIn('id="backed"', page)
        for gone in ("NVIDIA Inception Program", "Z Fellows", "Google for Startups", "Yandex Cloud"):
            self.assertNotIn(f'alt="{gone}"', page)
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
        for chunk in ("Content Producer", "To apply", "Build with us",
                      'id="content-producer"', 'id="application"', 'name="work"'):
            self.assertContains(careers, chunk)
        # the topbar carries the mark alone; the wordmark belongs to the
        # footer, so this has to look at the header and not the whole page
        header = home.content.decode().split("<header", 1)[1].split("</header>", 1)[0]
        self.assertNotIn(">defex<", header)
        self.assertIn(">defex<", home.content.decode())   # present in the footer
        self.assertContains(home, 'id="film"')
        # nothing plays before the hero: the starting page (the mark on black) is gone
        self.assertNotContains(home, 'id="intro"')
        self.assertNotContains(home, "is-intro")
        self.assertNotContains(home, "js/intro.js")
        # the clip stays under the hero; the "where it started" label and page do not
        self.assertNotContains(home, "/where-it-started/")
        self.assertNotContains(home, "Where it started")
        self.assertNotContains(home, "where it started")
        self.assertContains(home, 'id="origin-video" muted loop')
        self.assertContains(home, "That is how we learned the camera is not enough")
        # no example text in the part field
        self.assertNotContains(home, 'placeholder="e.g.')
        self.assertContains(home, "js/origin.js")
        # it was indexed, so the old URL redirects home rather than 404ing
        origin = self.client.get("/where-it-started/")
        self.assertEqual(origin.status_code, 301)
        self.assertEqual(origin["Location"], "/")
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
        for asset in ("js/hero-film.js", "js/origin.js", "js/reveal.js", "img/backers/nvidia-inception.png", "img/backers/zfellows.png", "img/backers/zfellows-collage.png", "img/backers/google-for-startups.png", "img/backers/a16z.png", "img/backers/yandex-cloud.png", "video/origin.mp4", "video/origin-poster.jpg"):
            self.assertEqual(self.client.get(f"/static/{asset}").status_code, 200, asset)

    def test_scroll_videos_support_byte_ranges(self):
        """Scroll seeking needs partial responses at both ends of each film."""
        for path in ("defex/assets/defex-intro-v4.mp4", "why/story.mp4"):
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

    def test_one_clear_way_in_for_a_factory(self):
        """Husan's call, 2026-09-20: a factory buyer gets one path. "Test our
        product" sits under the hero film and opens the pitch; the pitch shows
        the options, each one carries to the sign-up at the end of the same
        page, and that sign-up is a founder's calendar or the form. Nobody is
        sent back to the home page to book."""
        home = self.client.get("/").content.decode()
        actions = home.split('class="lede__actions"', 1)[1].split("</div>", 1)[0]
        self.assertIn('class="glass-button-wrap" href="/why-us/"', actions)
        self.assertIn("Test our product", actions)
        pitch = self.client.get("/why-us/").content.decode()
        main = pitch.split("<main", 1)[1]
        self.assertNotIn('href="/#contact"', main)
        self.assertIn('href="#pricing">See the options', main)
        for pick in ("part", "place", "bench"):
            self.assertIn(f'href="#talk" data-pick="{pick}"', main)
            self.assertIn(f'<option value="{pick}">', main)
        talk = main.split('id="talk"', 1)[1]
        for piece in ('id="contact"', 'id="cal-inline"', 'data-cal="husan-mavlonov-qxqy1a/30min"',
                      'action="/contact/"', 'name="option"', "Book a call with a founder."):
            self.assertIn(piece, talk)
        self.assertIn("js/book.js", pitch)
        # the option they picked reaches the inbox
        from unittest.mock import patch
        payload = {"name": "A Buyer", "factory": "A Factory", "contact": "buyer@example.com",
                   "product": "12-pin connector", "option": "place"}
        with patch("landing.views.send", return_value=(True, "sent")) as sent:
            response = self.client.post("/contact/", payload, HTTP_REFERER="http://testserver/why-us/")
        self.assertEqual(response["Location"], "http://testserver/why-us/#contact")
        self.assertIn("Hold my place ($1,000)", sent.call_args[0][1])
        back = self.client.get("/why-us/").content.decode()
        self.assertIn("We reply within one working day", back)
        with patch("landing.views.send", return_value=(True, "sent")):
            bad = self.client.post("/contact/", dict(payload, option="free-robot"), follow=True)
        self.assertIn("what you want", bad.content.decode())

    def test_registered_companies_roll_by_name(self):
        """Husan's call: one list (discovery.IN_LINE) feeds a rolling row labelled
        "Registered", after the case on the home page and after "Factories are
        already in line" on the pitch. Every mark is the company's own file,
        served as it was sent; the greyed look is CSS. The row is laid out four
        times so it never runs dry, and only the first set is read out."""
        from landing.discovery import IN_LINE
        self.assertGreaterEqual(len(IN_LINE), 6)
        home = self.client.get("/").content.decode()
        pitch = self.client.get("/why-us/").content.decode()
        self.assertLess(home.index('id="why"'), home.index('id="in-line"'))
        self.assertLess(home.index('id="in-line"'), home.index('id="team"'))
        self.assertLess(pitch.index('id="proof"'), pitch.index('id="in-line"'))
        self.assertLess(pitch.index('id="in-line"'), pitch.index('id="pricing"'))
        for page in (home, pitch):
            row = page.split('id="in-line"', 1)[1].split("</ul>", 1)[0]
            self.assertIn(">Registered<", row)
            for gone in ("Factories already in line", "Including"):
                self.assertNotIn(gone, row)
            self.assertEqual(row.count('class="roll__i"'), len(IN_LINE))
            self.assertEqual(row.count('class="roll__i roll__i--copy" aria-hidden="true"'), 3 * len(IN_LINE))
            for company in IN_LINE:
                self.assertEqual(row.count(f'alt="{company["name"]}"'), 1)
                self.assertEqual(row.count(f'/static/{company["logo"]}?v='), 4)
        for company in IN_LINE:
            self.assertTrue((Path(settings.BASE_DIR) / "static" / company["logo"]).exists(), company["logo"])
        css = (Path(settings.BASE_DIR) / "static/css/site.css").read_text()
        self.assertRegex(css, r"@keyframes roll \{ to \{ transform: translateX\(-25%\); \} \}")
        self.assertRegex(css, r"prefers-reduced-motion: reduce\) \{\s*\.roll__track \{ animation: none;")
        self.assertNotIn("in_line", self.client.get("/company.json").content.decode())

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

    def test_founding_team_is_on_the_home_page(self):
        """The two founders, between Why us and the open role: both names,
        both titles as co-founders, the twins line, portraits that exist and
        stay small, and the grid that inks the paper under them."""
        home = self.client.get("/")
        page = home.content.decode()
        self.assertContains(home, 'id="team-title" data-reveal data-grid-avoid>Founding <em>team</em></h2>')
        self.assertContains(home, "Founded by twin brothers who&rsquo;ve been building together for more than 20&nbsp;years.")
        for name, role in (("Husan Mavlonov", "Co-founder &amp; CEO"), ("Hasan Mavlonov", "Co-founder &amp; CTO")):
            self.assertContains(home, f'class="founder__name" data-grid-avoid>{name}</h3>')
            self.assertContains(home, f'class="founder__role" data-grid-avoid>{role}</p>')
        self.assertLess(page.index('id="why"'), page.index('id="team"'))
        self.assertLess(page.index('id="team"'), page.index('id="careers"'))
        self.assertContains(home, "js/gridpulse.js")
        self.assertEqual(self.client.get("/static/js/gridpulse.js").status_code, 200)
        photos = Path(settings.BASE_DIR) / "static" / "img" / "team"
        # each portrait in black and white, and the colour print that develops
        # over it under the pointer
        for person in ("husan-mavlonov", "hasan-mavlonov", "husan-mavlonov-color", "hasan-mavlonov-color"):
            for width in (360, 720):
                photo = photos / f"{person}-{width}.webp"
                self.assertIn(f"img/team/{photo.name}", page)
                self.assertLessEqual(photo.stat().st_size, 120 * 1024, photo.name)
        # Husan asked for this line to go from Hasan's bio
        self.assertNotContains(home, "robot software and hardware integration")

    def test_why_us_page(self):
        """The case for the robot, on its own dark page. It opens on WHY US
        (the Glyph Portal), speaks in short plain words, never says
        "assembly" or "A1", labels the render and the one target, asks
        factories to book a call, keeps the customer call to action at the end."""
        import re
        response = self.client.get("/why-us/")
        self.assertEqual(response.status_code, 200)
        body = response.content.decode()
        self.assertIn("<title>Why Defex | Robots that test every part they build</title>", body)
        self.assertIn('data-word="WHY US"', body)
        self.assertIn('id="why-title"><span class="wy-sr">Why us: </span>Robots that test every part', body)
        for section in ("portal", "problem", "promise", "watch", "tests", "learns", "resets", "newpart", "proof", "pricing", "faq", "founders", "talk"):
            self.assertIn(f'id="{section}"', body)
        for claim in ("Concept render", "Target</span>", "factories paid to be first in line.",
                      'href="#talk"', "Book a call", "Robots are cheap."):
            self.assertIn(claim, body)
        # what it costs comes after the proof and before the questions, robot price first
        self.assertLess(body.index('id="proof"'), body.index('id="pricing"'))
        self.assertLess(body.index('id="pricing"'), body.index('id="faq"'))
        for claim in ("$65,000", "passes your test on your floor", "You only pay for a yes.", "Not a new project.", "Send us your part"):
            self.assertIn(claim, body)
        self.assertLess(body.index('id="talk"'), body.index("<footer"))
        self.assertEqual(body.count('class="arm__svg"'), 1)
        for word in ("Domino", "Khosla", "valuation"):
            self.assertNotIn(word, body)
        text = re.sub(r"<[^>]+>", " ", re.sub(r"<(script|style)\b.*?</\1>", " ", body, flags=re.S))
        self.assertIsNone(re.search(r"assembl", text, re.I), "the page says assembly")
        self.assertNotIn("A1", text)
        self.assertIsNone(re.search(r"\b0\d\b", text), "a numbered step")
        for gone in ("nobody else", "the only", "robot software and hardware integration"):
            self.assertNotIn(gone, text)
        # the portal keeps its licence notice; the clip and its stills stay small
        root = Path(settings.BASE_DIR)
        self.assertIn("Glyph Portal \u00a9 2026 Christian Katzmann. MIT.", (root / "static/js/portal.js").read_text())
        for asset, cap in (("why/story.mp4", 2 * 1024 * 1024), ("why/story-first.webp", 80 * 1024), ("why/story-lit.webp", 80 * 1024)):
            self.assertIn(asset, body)
            self.assertLessEqual((root / "static" / asset).stat().st_size, cap, asset)
        for script in ("js/portal.js", "js/why.js"):
            self.assertIn(script, body)
            self.assertEqual(self.client.get(f"/static/{script}").status_code, 200)
        # reachable from the nav on every page, and from the home page's claims
        # "Why us" is out of the nav for now: the pitch is reached through
        # "Test our product" under the hero film, and from the home page's claims
        for path in ("/", "/careers/", "/blog/", "/company/", "/why-us/"):
            header = self.client.get(path).content.decode().split("<header", 1)[1].split("</header>", 1)[0]
            self.assertNotIn("Why us", header, path)
            self.assertNotIn('href="/why-us/"', header, path)
        home = self.client.get("/").content.decode()
        self.assertRegex(home, r'class="features__more">\s*<a class="glass-button-wrap" href="/why-us/">')
        self.assertNotIn("See why it works", home)
        self.assertIn("Test our product", home.split('class="features__more"', 1)[1].split("</p>", 1)[0])
        # the three claims are not numbered
        self.assertNotIn("feature__n", home)

    def test_blog_robot_has_a_still_for_when_webgl_cannot_run(self):
        """A factory office PC with WebGL off saw an empty half page where the
        robot stands. It gets a still of the same robot instead."""
        still = Path(settings.BASE_DIR) / "static" / "img" / "robot-still.webp"
        self.assertLessEqual(still.stat().st_size, 80 * 1024)
        css = (Path(settings.BASE_DIR) / "static/css/site.css").read_text()
        self.assertRegex(css, r'\.spline\.is-failed \{[^}]*robot-still\.webp')
        self.assertIn("is-failed", (Path(settings.BASE_DIR) / "static/js/spline.js").read_text())
        self.assertIn("robot-still.webp", self.client.get("/blog/").content.decode())
        self.assertNotContains(self.client.get("/blog/"), "min read")

    def test_hasan_leads_with_the_personality_layer(self):
        """Husan's call: Hasan is presented first for building a personality
        layer for AI, on every page that describes him."""
        for path in ("/", "/why-us/", "/company/"):
            body = self.client.get(path).content.decode()
            self.assertIn("personality layer for AI", body, path)
            self.assertNotIn("robot software and hardware integration", body, path)

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
        for path in ("/", "/careers/"):
            body = self.client.get(path).content.decode()
            self.assertIn('property="og:image" content="https://defexrobotics.com/static/img/og.jpg?v=', body)
            self.assertIn('name="twitter:image" content="https://defexrobotics.com/static/img/og.jpg?v=', body)

    def test_every_class_on_the_marketing_pages_is_styled(self):
        """A CSS edit that drops a rule block renders the section unstyled but
        still returns 200, so nothing else here catches it. This does."""
        import re
        root = Path(settings.BASE_DIR)
        css = (root / "static/css/site.css").read_text()
        # rules inside a media query do not style the default (desktop) case
        top = re.sub(r"@media[^{]*\{(?:[^{}]|\{[^{}]*\})*\}", "", css, flags=re.S)
        used = set()
        for name in ("home.html", "why_us.html", "_inline.html", "_arm.html", "_topbar.html", "_scan.html", "blog/index.html",
                     "blog/_article.html", "blog/the-cost-of-the-next-attempt.html",
                     "blog/the-ai-inference-revolution-is-here.html"):
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

    def test_the_three_offices_are_named_across_the_site(self):
        """His three offices: San Francisco, Hong Kong, Shanghai. In the
        footer of every page, in the company copy, and as three
        live clocks at the end of Why us."""
        footer = 'class="footer__line">San Francisco &middot; Hong Kong &middot; Shanghai</span>'
        for path in ("/", "/why-us/", "/company/", "/careers/", "/blog/",
                     "/blog/the-cost-of-the-next-attempt/"):
            self.assertIn(footer, self.client.get(path).content.decode(), path)
        why = self.client.get("/why-us/").content.decode()
        for city, zone in (("San Francisco", "America/Los_Angeles"), ("Hong Kong", "Asia/Hong_Kong"), ("Shanghai", "Asia/Shanghai")):
            self.assertIn(f'<span class="city__n">{city}</span><span class="city__t" data-tz="{zone}">', why)
        self.assertIn("offices in Hong Kong and Shanghai", self.client.get("/company/").content.decode())

    def test_stylesheet_braces_balance(self):
        """A stray closing brace after the last media query made browsers
        drop the rule under it (.is-off, which pauses the blog's figures off
        screen), and every page still returned 200. Each closing brace has to
        close one that is open, and none is left open at the end."""
        import re
        css = (Path(settings.BASE_DIR) / "static/css/site.css").read_text()
        depth = 0
        for line, text in enumerate(re.sub(r"/\*.*?\*/", lambda m: "\n" * m.group(0).count("\n"), css, flags=re.S).splitlines(), 1):
            for char in text:
                depth += {"{": 1, "}": -1}.get(char, 0)
                self.assertGreaterEqual(depth, 0, f"a closing brace with nothing open on line {line}")
        self.assertEqual(depth, 0, "a brace left open")

    def test_blog(self):
        """The article is the first thing on the site meant to be read rather
        than skimmed. The page has to carry the whole text, the instruments
        the text leans on, and the honesty line under the numbers."""
        import re
        index = self.client.get("/blog/")
        self.assertEqual(index.status_code, 200)
        self.assertContains(index, "The Cost of the Next Attempt")
        self.assertContains(index, 'href="/blog/the-cost-of-the-next-attempt/"')
        post = self.client.get("/blog/the-cost-of-the-next-attempt/")
        self.assertEqual(post.status_code, 200)
        body = post.content.decode()
        for chunk in ('class="standfirst"', "Trials per hour", 'id="bench"', '<h1 class="post__title engraved">The Cost of the Next Attempt</h1>',
                      # the three worked examples from the text, as presets
                      'data-preset="20,10,90,0"', 'data-preset="10,10,90,0"', 'data-preset="20,10,10,0"',
                      "not Defex measurements",
                      "Evidence to collect",
                      'property="og:type" content="article"', '"@type": "BlogPosting"',
                      'rel="canonical" href="https://defexrobotics.com/blog/the-cost-of-the-next-attempt/"',
                      "js/post.js", "js/reveal.js", "data-copy-link",
                      # the scan mark on the way back, the byline
                      'class="scan"',
                      "By <a class=\"link\" href=\"https://husanmavlonov.com/\">Husan Mavlonov</a>",
                      '"@type": "Person", "@id": "https://husanmavlonov.com/#person"', 'class="author__bio"'):
            self.assertContains(post, chunk)
        # the feed: same registry, so the post is in it
        feed = self.client.get("/blog/feed.xml")
        self.assertEqual(feed.status_code, 200)
        self.assertIn("xml", feed["Content-Type"])
        self.assertIn("https://defexrobotics.com/blog/the-cost-of-the-next-attempt/", feed.content.decode())
        self.assertIn("Husan Mavlonov", feed.content.decode())
        self.assertContains(post, 'type="application/rss+xml"')
        # no chart before the first sentence, and no embossed headings in the article
        self.assertNotContains(post, 'id="loop"')
        self.assertContains(post, '<h2 class="engraved" id="ready-again"')
        self.assertNotContains(post, "min read")
        self.assertNotContains(post, "Tell us where we are wrong")
        self.assertContains(post, "August 30, 2026")
        self.assertContains(post, '"datePublished": "2026-08-30"')
        self.assertContains(post, '"dateModified": "2026-09-20"')
        self.assertIn("<loc>https://defexrobotics.com/blog/the-cost-of-the-next-attempt/</loc><lastmod>2026-09-20</lastmod>",
                      self.client.get("/sitemap.xml").content.decode())
        self.assertNotContains(index, 'rel="modulepreload"')
        self.assertNotContains(index, 'rel="preload" as="fetch" href="https://prod.spline.design/')
        # analytics only when switched on, so the tag never 404s on every page
        self.assertNotIn("_vercel/insights", self.client.get("/").content.decode())
        with override_settings(WEB_ANALYTICS=True):
            self.assertIn("_vercel/insights/script.js", self.client.get("/").content.decode())
        # the index hero: the Spline robot on its vendored runtime, the title,
        # the mark on the eyebrow
        for chunk in ('class="spline" data-spline="https://prod.spline.design/', 'data-reveal>Blog.', "js/spline.js",
                      'data-runtime="/static/vendor/spline-2.0.46/runtime.standalone.webgl.js',
                      'class="eyebrow eyebrow--scan" data-reveal data-scan'):
            self.assertContains(index, chunk)
        for asset in ("/static/vendor/spline-2.0.46/runtime.standalone.webgl.js", "/static/vendor/spline-2.0.46/process.js"):
            self.assertEqual(self.client.get(asset).status_code, 200, asset)
        self.assertEqual(self.client.get("/static/js/spline.js").status_code, 200)
        # every label in the section strip points at a heading that exists
        hrefs = re.findall(r'class="sections__link" href="#([^"]+)"', body)
        self.assertGreaterEqual(len(hrefs), 5)
        for anchor in hrefs:
            self.assertIn(f'id="{anchor}"', body)
        # an unpublished slug is a 404, not a template error
        self.assertEqual(self.client.get("/blog/not-a-post/").status_code, 404)
        # the blog and the product swapped places: the blog is the pill in the
        # nav on every page, plus a footer link; the product is under the hero film
        for path in ("/", "/careers/", "/blog/"):
            page = self.client.get(path).content.decode()
            header = page.split("<header", 1)[1].split("</header>", 1)[0]
            self.assertIn('href="/blog/" class="glass-button-wrap glass-button-wrap--nav"', header, path)
            footer_path = "/company/" if path == "/blog/" else "/blog/"
            self.assertIn(f'class="footer__blog link" href="{footer_path}"', page, path)
        home = self.client.get("/").content.decode()
        # the hero carries one button, the product; the blog's way in is the
        # pill in the nav, which replaced the square "Get in touch"
        self.assertNotIn('class="glass-button-wrap" href="/blog/"', home)
        self.assertNotIn('class="beam', home)
        home_header = home.split("<header", 1)[1].split("</header>", 1)[0]
        self.assertIn("glass-button-wrap--nav", home_header)
        self.assertIn(">Blog<svg", home_header)
        self.assertNotIn("Test our product", home_header)
        self.assertNotIn("Get in touch", home_header)
        sitemap = self.client.get("/sitemap.xml").content.decode()
        self.assertIn("<loc>https://defexrobotics.com/blog/</loc>", sitemap)
        self.assertIn("<loc>https://defexrobotics.com/blog/the-cost-of-the-next-attempt/</loc>", sitemap)
        self.assertEqual(self.client.get("/static/js/post.js").status_code, 200)

    def test_inference_article(self):
        from landing.views import POSTS

        article = next(post for post in POSTS if post["slug"] == "the-ai-inference-revolution-is-here")
        self.assertEqual(article["author"]["name"], "Matthew S. Smith")
        self.assertEqual(article["author"]["site"], "mattontech.me")
        self.assertNotIn("source", article)
        self.assertNotIn("canonical_url", article)

        index = self.client.get("/blog/")
        self.assertContains(index, "The AI Inference Revolution Is Here")
        self.assertContains(index, 'href="/blog/the-ai-inference-revolution-is-here/"')

        post = self.client.get("/blog/the-ai-inference-revolution-is-here/")
        self.assertEqual(post.status_code, 200)
        body = post.content.decode()
        for chunk in (
            '<h1 class="post__title engraved">The AI Inference Revolution Is Here</h1>',
            "Matthew S. Smith",
            'rel="canonical" href="https://defexrobotics.com/blog/the-ai-inference-revolution-is-here/"',
            "How does AI inference differ from AI training?", "Memory’s role in inferencing",
            "Combining chips for faster inference", "Learning to do more with less (bits)",
            "Inference is everyone’s game", "article-image__panel",
        ):
            self.assertContains(post, chunk)
        self.assertNotIn("Originally published by", body)
        self.assertNotIn("IEEE Spectrum", body)
        self.assertNotIn('"isBasedOn"', body)
        self.assertGreaterEqual(body.count('class="figure figure--wide article-image"'), 8)
        self.assertNotIn("**ince", body)
        self.assertNotIn(">audio player<", body)

        sitemap = self.client.get("/sitemap.xml").content.decode()
        self.assertIn("/blog/the-ai-inference-revolution-is-here/", sitemap)
        feed = self.client.get("/blog/feed.xml").content.decode()
        self.assertIn("The AI Inference Revolution Is Here", feed)
        self.assertIn("Matthew S. Smith", feed)

    def test_no_template_syntax_reaches_the_browser(self):
        """A multi-line {# #} comment is not a comment in Django: the whole
        thing rendered as text inside the nav on every page, live, and
        nothing here noticed. Now something does."""
        for path in ("/", "/careers/", "/blog/",
                     "/blog/the-cost-of-the-next-attempt/",
                     "/blog/the-ai-inference-revolution-is-here/"):
            body = self.client.get(path).content.decode()
            for leak in ("{#", "#}", "{%", "{{", "%}", "}}"):
                self.assertNotIn(leak, body, f"{leak!r} leaked into {path}")
            # the nav is one line of short labels, never a paragraph
            header = body.split("<header", 1)[1].split("</header>", 1)[0]
            import re
            words = re.sub(r"<[^>]+>", " ", header).split()
            self.assertLessEqual(len(words), 12, f"nav on {path} carries {len(words)} words: {' '.join(words)[:120]}")

    def test_emails_carry_the_current_positioning(self):
        """The auto-reply asked visitors for "photos of typical defects, the
        inspection role you want to replace" long after the company had moved
        to self-teaching robots. It signs off with the positioning instead."""
        from landing.notify import autoresponder_email
        subject, html = autoresponder_email("Ada Lovelace", "Analytical Engines")
        self.assertIn("Self-teaching robots for manufacturing", html)
        for stale in ("inspection", "defect", "vision"):
            self.assertNotIn(stale, html.lower())

    def test_crawl_surface(self):
        robots = self.client.get("/robots.txt")
        self.assertEqual(robots.status_code, 200)
        self.assertIn("text/plain", robots["Content-Type"])
        self.assertIn("Sitemap: https://defexrobotics.com/sitemap.xml", robots.content.decode())

        sitemap = self.client.get("/sitemap.xml")
        self.assertEqual(sitemap.status_code, 200)
        self.assertIn("xml", sitemap["Content-Type"])
        body = sitemap.content.decode()
        for path in ("/", "/careers/"):
            self.assertIn(f"<loc>https://defexrobotics.com{path}</loc>", body)

        # the demo page was unreachable from the site for weeks; keep it linked
        home = self.client.get("/").content.decode()

        # the founder link must stay bidirectional with husanmavlonov.com
        self.assertIn("https://husanmavlonov.com/#person", home)
        self.assertIn("https://defexrobotics.com/#org", home)


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
        self.assertIn("defexrobotics.com", ns["ALLOWED_HOSTS"])
        self.assertIn("https://defexrobotics.com", ns["CSRF_TRUSTED_ORIGINS"])

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
