import re
from pathlib import Path

from django.conf import settings
from django.test import SimpleTestCase, override_settings


@override_settings(SECURE_SSL_REDIRECT=False)
class PrototypeTests(SimpleTestCase):
    def test_production_bundle_loads_worker_and_wasm_from_same_origin(self):
        response = self.client.get('/prototype/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['X-Frame-Options'], 'SAMEORIGIN')
        self.assertIn('s-maxage=86400', response['Cache-Control'])
        self.assertNotIn('Set-Cookie', response)
        self.assertContains(response, 'About this model.')
        self.assertContains(response, 'not a trained robot policy')
        self.assertContains(response, 'Interactive simulation')
        assets = Path(settings.BASE_DIR) / 'static' / 'prototype' / 'assets'
        for path in re.findall(r'(?:src|href)="(/static/prototype/assets/[^" ]+)"', response.content.decode()):
            self.assertEqual(self.client.get(path).status_code, 200, path)
        worker = list(assets.glob('simulation.worker-*.js'))
        wasm = list(assets.glob('*.wasm'))
        self.assertEqual(len(worker), 1)
        self.assertEqual(len(wasm), 1)
        wasm_response = self.client.get('/static/prototype/assets/' + wasm[0].name)
        self.assertEqual(wasm_response.status_code, 200)
        self.assertEqual(wasm_response['Content-Type'], 'application/wasm')
        self.assertIn(wasm[0].name, worker[0].read_text())

    def test_the_prototype_opens_on_the_thinking_orb(self):
        """His call, 2026-10-04: the prototype starts on the thinking orb from
        the component he sent, with "Loading" under it, and the screen simply
        fades once the simulation hides its own #loading. No green resolve."""
        body = self.client.get('/prototype/').content.decode()
        start = body.index('<body>')
        self.assertLess(body.index('js/orb-loader.js?v='), body.index('<main>'))
        self.assertGreater(body.index('js/orb-loader.js?v='), start)
        self.assertIn('css/orb-loader.css?v=', body[:start])
        css = (Path(settings.BASE_DIR) / 'static/css/orb-loader.css').read_text()
        self.assertIn('.orbload.is-done { opacity: 0;', css)
        script = (Path(settings.BASE_DIR) / 'static/js/orb-loader.js').read_text()
        self.assertIn("getElementById('loading')", script)
        self.assertIn('Loading<span class="orbload__dots"', script)
        for green in ('52,211,153', 'sweep', 'resolve('):
            self.assertNotIn(green, script)
        self.assertEqual(self.client.get('/static/js/orb-loader.js').status_code, 200)

    def test_the_page_is_in_step_with_its_source(self):
        """templates/landing/prototype.html is generated from prototype/index.html
        (prototype/scripts/integrate.mjs) and CI regenerates it before these tests,
        so a hand edit to the generated page alone is lost there. Everything from
        <main> to the <noscript> note must be the source's own markup (Vite only
        moves the source's module script into the head)."""
        root = Path(settings.BASE_DIR)
        source = (root / 'prototype/index.html').read_text()
        page = (root / 'templates/landing/prototype.html').read_text()
        main = source[source.index('<main>'):source.index('</noscript>') + len('</noscript>')]
        self.assertIn(main, page)
        self.assertNotIn('Assembly', source)

    def test_the_story_is_measure_feel_and_check(self):
        """His call, 2026-10-13: the robot measures every unit, feels its way in
        and checks every connection. A saved correction only fixes a constant
        bias, so the page never says the robot learns or reuses a fit."""
        root = Path(settings.BASE_DIR) / 'prototype'
        page = (root / 'index.html').read_text()
        script = (root / 'src/main.ts').read_text()
        for source in (page, script):
            lowered = source.lower()
            for claim in ('learn', 'teach', 'correction', 'first try', 'saved fit', 'reuse fit'):
                self.assertNotIn(claim, lowered)
        self.assertIn('<button data-cycle-case="pass" aria-pressed="true" aria-label="Pass">passes</button>', page)
        self.assertNotIn('data-cycle-case="latched"', page)
        self.assertIn('<span id="cycle-detail" hidden></span>', page)
        self.assertNotIn('data-controller="reuse"', page)
        # Nor do the downloaded records: no saved fit, calibration or reuse path in the engine or its export.
        for name in ('src/engine.ts', 'src/simulation.worker.ts', 'src/model.ts'):
            lowered = (root / name).read_text().lower()
            for claim in ('correction', 'calibration', "'reuse'", 'forget'):
                self.assertNotIn(claim, lowered, name)

    def test_the_demo_never_starts_by_itself(self):
        """His call, 2026-10-04: the prototype is shown, not played. Nothing links
        to ?play=1, and the prototype ignores it, so old links open it idle too."""
        source = (Path(settings.BASE_DIR) / 'prototype/src/main.ts').read_text()
        self.assertNotIn("has('play')", source)
        self.assertNotIn('startTour();},900', source)
        for path in ('/', '/why-us/', '/prototype/', '/careers/', '/blog/'):
            self.assertNotIn('?play=1', self.client.get(path).content.decode(), path)


    def test_the_line_keeps_making_units(self):
        """2026-10-13: units ride on pallets through the cell, so Play keeps
        producing units, the stage keeps a running tally, and the About notes
        say how units flow and that pallet repeatability is not yet proven."""
        root = Path(settings.BASE_DIR) / 'prototype'
        page = (root / 'index.html').read_text()
        self.assertIn('<p class="headline-note">Measures every unit. Checks every wire.</p>', page)
        self.assertNotIn('Plug in. Pull. Test every wire.', page)
        self.assertIn('id="line-status"', page)
        self.assertIn('<dt>How units flow</dt>', page)
        self.assertIn('pallet repeatability', page)
        self.assertIn('max="108"', page)
        process = (root / 'src/process.ts').read_text()
        self.assertIn("'Locate the unit'", process)
        self.assertIn("'Next unit'", process)


@override_settings(SECURE_SSL_REDIRECT=False)
class PrototypeQaTests(SimpleTestCase):
    """2026-10-15 QA pass on /prototype/: the case roll, the band under the stage,
    the words a screen reader and a share card get, and the browser edges."""
    root = Path(settings.BASE_DIR) / 'prototype'

    def css(self):
        return (self.root / 'src/style.css').read_text()

    def test_the_case_roll_clears_the_topbar_on_a_phone_on_its_side(self):
        css = self.css()
        self.assertIn('@media(orientation:landscape) and (max-height:500px){body.process-mode .roll{top:64px;', css)
        self.assertNotIn('body.process-mode .roll{top:14px', css)

    def test_the_case_roll_is_dark_type_on_its_halo_on_phones_on_every_shot(self):
        css = self.css()
        phone = css[css.index('@media(max-width:700px){\n  /* phones: high on the right'):]
        phone = phone[:phone.index('\n}\n')]
        self.assertNotIn('#f4f6f1', phone)
        self.assertNotIn('color:#fff', phone)
        self.assertIn('text-shadow:0 0 3px #eef0ea,0 0 10px #eef0ea,0 0 22px #eef0eacc', css)

    def test_the_case_roll_steps_aside_on_the_held_reject_shot(self):
        self.assertIn('body.process-mode[data-shot="reject"] .roll,body.process-mode[data-cam="reject"] .roll{opacity:0;pointer-events:none}', self.css())

    def test_no_empty_band_under_the_stage_and_the_try_it_line_stays_one_line(self):
        css = self.css()
        self.assertIn('.process-guide>[hidden]{display:none!important}', css)
        self.assertIn('.process-guide:not(:has(>:not([hidden]))){padding:0}', css)
        self.assertIn('.tryit>summary{white-space:nowrap}', css)
        self.assertIn('@media(max-width:600px){.tryit>summary span{display:none}}', css)
        self.assertIn('.tryit>summary span{color:var(--muted);', css)
        self.assertIn('.table-scroll{overflow-x:auto;', css)

    def test_the_page_describes_the_robot_not_a_cell(self):
        page = self.client.get('/prototype/').content.decode()
        line = 'An interactive simulation of the robot: it measures every unit, feels its way in and checks every connection.'
        self.assertEqual(page.count(line), 3)
        for gone in ('connector cell', 'Connector lab', 'Workcell controls', 'Build the cell'):
            self.assertNotIn(gone, page)
        self.assertIn('<section class="stage" aria-label="The robot: 3D simulation">', page)
        self.assertIn('<nav class="dock" aria-label="Simulation controls">', page)
        self.assertIn('<dt>Next</dt><dd>Build the robot and run it on customer parts.', page)
        # his call: the h1 stays
        self.assertIn('<h1>Connector<br>workcell.</h1>', page)
        scene = (self.root / 'src/scene.ts').read_text()
        self.assertIn('passed units go into a tote and rejects into a locked red bin', scene)
        player = (self.root / 'src/cycle-player.ts').read_text()
        self.assertNotIn('operator clear required', player)
        self.assertIn("'rejected / a person clears it'", player)

    def test_the_share_image_is_versioned_like_every_other_page(self):
        page = self.client.get('/prototype/').content.decode()
        v = settings.DEFEX_ASSET_VERSION
        self.assertIn(f'<meta property="og:image" content="https://defexrobotics.com/static/img/og.jpg?v={v}" />', page)
        self.assertIn(f'<meta name="twitter:image" content="https://defexrobotics.com/static/img/og.jpg?v={v}" />', page)

    def test_tooltip_close_button_and_labels_are_accessible(self):
        page = (self.root / 'index.html').read_text()
        self.assertIn('<div id="tooltip" class="tooltip" role="tooltip" aria-label="Part name">', page)
        scene = (self.root / 'src/scene.ts').read_text()
        self.assertIn("tip.setAttribute('aria-label',name)", scene)
        self.assertIn('#close-notes:focus{outline:2px solid #365c3f;', self.css())

    def test_the_browser_edges_match_the_stage_and_the_ground_under_it(self):
        page = self.client.get('/prototype/').content.decode()
        self.assertIn('<meta name="theme-color" media="(max-width: 600px)" content="#C9CBC6" />', page)
        self.assertIn('<meta name="theme-color" content="#919491" />', page)
        self.assertNotIn('#161918', page)
        css = self.css()
        self.assertIn('@keyframes edge-to-ground{0%{background-color:#919491}1%,100%{background-color:#eceee6}}', css)
