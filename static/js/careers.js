(() => {
    const form = document.querySelector('.form--apply');
    if (!form) return;
    const select = form.querySelector('[name="role"]');
    const note = form.querySelector('[name="note"]');
    const submit = form.querySelector('[type="submit"]');
    const submitLabel = submit.textContent;
    let submitting = false;

    function syncPrompt() {
        const option = select.options[select.selectedIndex];
        if (note && option) note.placeholder = option.dataset.evidence || '';
    }

    document.querySelectorAll('[data-apply-role]').forEach((link) => {
        link.addEventListener('click', (event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            select.value = link.dataset.applyRole;
            syncPrompt();
            event.preventDefault();
            history.replaceState(null, '', '#application');
            form.scrollIntoView({ block: 'start' });
            form.querySelector('[name="name"]').focus({ preventScroll: true });
        });
    });

    document.querySelectorAll('[data-copy-link]').forEach((button) => {
        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(button.dataset.copyLink);
                button.textContent = 'Link copied';
            } catch (error) {
                button.textContent = 'Copy unavailable';
            }
            setTimeout(() => { button.textContent = 'Copy job link'; }, 1600);
        });
    });

    function openLinkedRole() {
        let id;
        try { id = decodeURIComponent(location.hash.slice(1)); } catch (error) { return; }
        const role = id && document.getElementById(id);
        if (!role || role.tagName !== 'DETAILS') return;
        role.open = true;
        if (!form.querySelector('[role="alert"]') && !form.querySelector('.form__flash')) {
            select.value = id;
            syncPrompt();
        }
    }

    form.addEventListener('submit', (event) => {
        if (submitting) { event.preventDefault(); return; }
        submitting = true;
        submit.disabled = true;
        submit.textContent = 'Sending…';
        form.setAttribute('aria-busy', 'true');
    });
    addEventListener('pageshow', () => {
        submitting = false;
        submit.disabled = false;
        submit.textContent = submitLabel;
        form.removeAttribute('aria-busy');
    });
    select.addEventListener('change', syncPrompt);
    addEventListener('hashchange', openLinkedRole);
    syncPrompt();
    openLinkedRole();
})();
