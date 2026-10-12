(() => {
    // The legal pages' list of sections (Skiper's terms layout, his call,
    // 2026-10-12): built from the article's h2s, sticky down the left from
    // 900px, the section being read at full ink with the bar beside it.
    const toc = document.querySelector('.legal__toc');
    const article = document.querySelector('.prose--legal');
    if (!toc || !article) return;
    const heads = [...article.querySelectorAll('h2')];
    if (heads.length < 2) return;
    const list = toc.querySelector('.legal__list');
    const bar = toc.querySelector('.legal__bar');
    const used = new Set();
    const slug = (text) => {
        let base = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
        let id = base, n = 2;
        while (used.has(id) || (document.getElementById(id) && !heads.some(h => h.id === id))) id = `${base}-${n++}`;
        used.add(id);
        return id;
    };
    const links = heads.map((h) => {
        if (!h.id) h.id = slug(h.textContent);
        else used.add(h.id);
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${h.id}`;
        a.textContent = h.textContent.trim().replace(/\.$/, '');
        li.appendChild(a);
        list.appendChild(li);
        return a;
    });
    toc.hidden = false;

    let active = -1, queued = false;
    function mark(i) {
        if (i === active) return;
        active = i;
        links.forEach((a, k) => a.setAttribute('aria-current', k === i ? 'true' : 'false'));
        const a = links[i];
        bar.style.setProperty('--bar-y', `${a.offsetTop + a.offsetHeight / 2 - 10}px`);
    }
    function update() {
        queued = false;
        // a section is the one being read once its heading is in the top band
        const line = Math.min(window.innerHeight * 0.4, 200);
        let i = 0;
        heads.forEach((h, k) => { if (h.getBoundingClientRect().top < line) i = k; });
        // the last sections may never reach the line: at the foot of the page, the last one
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) i = heads.length - 1;
        mark(i);
    }
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    links.forEach((a, k) => a.addEventListener('click', () => { requestAnimationFrame(() => mark(k)); }));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
})();
