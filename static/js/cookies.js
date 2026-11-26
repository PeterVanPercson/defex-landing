(() => {
    // The cookie notice. Since 2026-11-26 (Husan's call) one slim pill at the
    // bottom centre in the site's own paper and ink: the card it replaced sat
    // on the hero's Y Combinator mark for a visitor's first seconds. It asks once, and the answer stays in this
    // browser's local storage (defex-cookies), not in a cookie. Nothing on
    // the site sets a cookie that needs the answer today (the Cal.com booking
    // calendar, which did, is gone), so Accept and Decline only record it.
    // Escape only puts the question off until the next visit. /cookies/
    // can ask again.
    const KEY = 'defex-cookies';
    const get = (store) => { try { return window[store].getItem(KEY); } catch (e) { return null; } };
    const put = (store, value) => { try { window[store].setItem(KEY, value); } catch (e) { /* private mode: ask again next time */ } };
    const drop = (store) => { try { window[store].removeItem(KEY); } catch (e) { /* nothing stored */ } };
    let box = null;

    function close() {
        if (!box) return;
        const gone = box;
        box = null;
        gone.classList.remove('is-in');
        setTimeout(() => gone.remove(), 250);
    }

    function answer(value) {
        put('localStorage', value);
        document.dispatchEvent(new CustomEvent('defex:cookies', { detail: value }));
        close();
    }

    function open() {
        if (box) return;
        box = document.createElement('div');
        box.className = 'cookie';
        box.setAttribute('role', 'region');
        box.setAttribute('aria-label', 'Cookies');
        box.innerHTML = '<p class="cookie__text">We use <a href="/cookies/">cookies</a> to improve your experience.</p>'
            + '<div class="cookie__actions">'
            + '<button type="button" class="cookie__btn" data-answer="declined">Decline</button>'
            + '<button type="button" class="cookie__btn cookie__btn--primary" data-answer="accepted">Accept</button>'
            + '</div>';
        box.addEventListener('click', (event) => {
            const choice = event.target.closest('[data-answer]');
            if (choice) answer(choice.dataset.answer);
        });
        box.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') { put('sessionStorage', 'later'); close(); }
        });
        document.body.appendChild(box);
        requestAnimationFrame(() => requestAnimationFrame(() => { if (box) box.classList.add('is-in'); }));
    }

    // "Change my answer" on /cookies/
    document.addEventListener('click', (event) => {
        if (!event.target.closest || !event.target.closest('[data-cookie-reopen]')) return;
        event.preventDefault();
        drop('localStorage');
        drop('sessionStorage');
        open();
    });

    if (!get('localStorage') && !get('sessionStorage')) setTimeout(open, 700);
})();
