(() => {
    const mount = document.getElementById('cal-inline');
    if (!mount) return;
    const calLink = mount.dataset.cal;
    if (!calLink) return;

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
                d.head.appendChild(d.createElement('script')).src = A;
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

    // No ui() call. The inline config below already puts theme=dark in the
    // iframe URL, and that URL renders fully dark on its own. Sending a ui
    // message on top of it re-themed the booker but left cal.com's own document
    // white, which showed as a band under their branding.
    Cal.ns.defex('inline', {
        elementOrSelector: '#cal-inline',
        calLink: calLink,
        config: { layout: 'month_view', theme: 'dark' },
    });

})();
