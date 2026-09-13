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

    // ui BEFORE inline, and it matters. Called after, the booker mounts on the
    // default theme first and cal.com's own page paints a white strip under the
    // card that no CSS of ours can reach, because it is inside their iframe.
    Cal.ns.defex('ui', {
        theme: 'dark',
        layout: 'month_view',
        hideEventTypeDetails: false,
        cssVarsPerTheme: { dark: { 'cal-bg': '#0C1116', 'cal-bg-emphasis': '#141A20' } },
    });
    Cal.ns.defex('inline', {
        elementOrSelector: '#cal-inline',
        calLink: calLink,
        config: { layout: 'month_view', theme: 'dark' },
    });

    // The direct link is in the markup so the page still works with the embed
    // blocked or cal.com down. Once the booker mounts it is redundant, so it
    // steps back rather than sitting there as a second call to action.
    const alt = document.getElementById('book-alt');
    if (alt) {
        new MutationObserver((_, obs) => {
            if (mount.querySelector('iframe')) { alt.classList.add('is-quiet'); obs.disconnect(); }
        }).observe(mount, { childList: true, subtree: true });
    }
})();
