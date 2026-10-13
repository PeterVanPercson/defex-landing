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
        self.assertIn('<button data-cycle-case="pass" aria-pressed="true">Pass</button>', page)
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
