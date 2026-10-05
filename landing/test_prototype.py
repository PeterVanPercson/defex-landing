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
        self.assertContains(response, 'INTERACTIVE SOFTWARE PROTOTYPE')
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
        self.assertIn('.orbload.is-done { opacity: 0;', body[:start])
        script = (Path(settings.BASE_DIR) / 'static/js/orb-loader.js').read_text()
        self.assertIn("getElementById('loading')", script)
        self.assertIn('Loading<span class="orbload__dots"', script)
        for green in ('52,211,153', 'sweep', 'resolve('):
            self.assertNotIn(green, script)
        self.assertEqual(self.client.get('/static/js/orb-loader.js').status_code, 200)
