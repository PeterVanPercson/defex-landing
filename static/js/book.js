(() => {
    const mount = document.getElementById('cal-inline');
    if (!mount) return;
    const calLink = mount.dataset.cal;
    if (!calLink) return;
    const panel = mount.closest('.booker__panel');
    const status = panel.querySelector('.booker__status');
    let timer = 0;
    function state(value, message) {
        panel.dataset.state = value;
        mount.setAttribute('aria-busy', String(value === 'loading'));
        if (message) status.textContent = message;
    }
    function failed() {
        clearTimeout(timer);
        state('failed', 'The calendar is taking longer than expected. You can open it directly or send a note below.');
    }

    // cal.com pulls in ~90 requests of its own, so it only starts when the
    // booker is a couple of screens away rather than with the page.
    const load = () => {
        state('loading', 'Loading available times…');
        timer = setTimeout(failed, 12000);
        // cal.com's own loader, unchanged apart from formatting. It appends
        // embed.js and queues calls until it is ready, so everything below can run
        // synchronously.
        (function (C, A, L) {
            const p = function (a, ar) { a.q.push(ar); };
            const d = C.document;
            C.Cal = C.Cal || function () {
                const cal = C.Cal;
                const ar = arguments;
                if (!cal.loaded) {
                    cal.ns = {};
                    cal.q = cal.q || [];
                    const script = d.createElement('script');
                    script.src = A;
                    script.async = true;
                    script.addEventListener('error', failed, { once: true });
                    d.head.appendChild(script);
                    cal.loaded = true;
                }
                if (ar[0] === L) {
                    const api = function () { p(api, arguments); };
                    const namespace = ar[1];
                    api.q = api.q || [];
                    if (typeof namespace === 'string') {
                        cal.ns[namespace] = cal.ns[namespace] || api;
                        p(cal.ns[namespace], ar);
                        p(cal, ['initNamespace', namespace]);
                    } else { p(cal, ar); }
                    return;
                }
                p(cal, ar);
            };
        })(window, 'https://app.cal.com/embed/embed.js', 'init');

        Cal('init', 'defex', { origin: 'https://app.cal.com' });
        Cal.ns.defex('on', { action: 'linkReady', callback: () => {
            clearTimeout(timer);
            state('ready');
        } });
        Cal.ns.defex('on', { action: 'linkFailed', callback: failed });

        // No ui() call. The inline config below already puts theme=dark in the
        // iframe URL, and that URL renders fully dark on its own. Sending a ui
        // message on top of it re-themed the booker but left cal.com's own document
        // white, which showed as a band under their branding.
        Cal.ns.defex('inline', {
            elementOrSelector: '#cal-inline',
            calLink: calLink,
            config: { layout: 'month_view', theme: 'dark' },
        });
    };

    if (!('IntersectionObserver' in window)) { load(); return; }
    const io = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        load();
    }, { rootMargin: '1500px 0px' });
    io.observe(mount);
})();
