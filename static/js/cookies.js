(() => {
    // The cookie notice (Husan's call, 2026-10-04): the shadcn Alert "cookie
    // notice" he sent, with its own words and look. It asks once, and the answer stays in this
    // browser's local storage (defex-cookies), not in a cookie. Accept leaves
    // everything as it is. Decline keeps the booking calendar, which sets
    // Cal.com's own cookies, out of our pages: static/js/book.js reads the
    // same key and offers the link to cal.com instead. The cross only puts
    // the question off until the next visit. /cookies/ can ask again.
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
        box.innerHTML = '<div class="cookie__row">'
            + '<div class="cookie__content">'
            + '<p class="cookie__title">We Value Your Privacy 🍪</p>'
            + '<p class="cookie__text">We use cookies to improve your experience, and show personalized content.</p>'
            + '<div class="cookie__actions">'
            + '<button type="button" class="cookie__btn cookie__btn--primary" data-answer="accepted">Accept</button>'
            + '<button type="button" class="cookie__btn" data-answer="declined">Decline</button>'
            + '</div></div>'
            + '<button type="button" class="cookie__close" aria-label="Close notification"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>'
            + '</div>';
        box.addEventListener('click', (event) => {
            const choice = event.target.closest('[data-answer]');
            if (choice) { answer(choice.dataset.answer); return; }
            if (event.target.closest('.cookie__close')) { put('sessionStorage', 'later'); close(); }
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
