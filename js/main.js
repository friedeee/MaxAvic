/* Max Avic : menu, animations, galerie et commande par WhatsApp. Le texte et les liens sont dans les pages HTML. */
(function () {
    'use strict';
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Menu mobile ---------- */
    const burger = $('.burger');
    const nav = $('#menu');
    if (burger && nav) {
        const setOpen = (open) => {
            nav.classList.toggle('is-open', open);
            burger.setAttribute('aria-expanded', String(open));
            burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
            document.body.classList.toggle('menu-open', open);
        };
        burger.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
        document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });
        $$('a', nav).forEach((link) => link.addEventListener('click', () => setOpen(false)));
    }

    /* ---------- En-tête qui s'affine au défilement ---------- */
    const header = $('.site-header');
    const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---------- Apparition au défilement ---------- */
    const revealed = $$('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
        revealed.forEach((el) => el.classList.add('is-visible'));
    } else {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -60px 0px' });
        revealed.forEach((el) => observer.observe(el));
    }

    /* ---------- Chiffres qui défilent ---------- */
    $$('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count);
        if (reduceMotion) { el.textContent = target; return; }
        const run = () => {
            const start = performance.now();
            const step = (now) => {
                const progress = Math.min(1, (now - start) / 1200);
                el.textContent = Math.round(target * (1 - (1 - progress) ** 3));
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        };
        const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) { run(); observer.disconnect(); } });
        observer.observe(el);
    });

    /* ---------- FAQ : une seule réponse ouverte à la fois ---------- */
    $$('.faq details').forEach((item, _, all) => {
        item.addEventListener('toggle', () => { if (item.open) all.forEach((other) => { if (other !== item) other.open = false; }); });
    });

    /* ---------- Galerie : filtres et visionneuse ---------- */
    const grid = $('.gallery');
    if (grid) {
        const items = $$('.gallery-item', grid);
        const filters = $$('[data-filter]');
        filters.forEach((button) => button.addEventListener('click', () => {
            const value = button.dataset.filter;
            filters.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
            items.forEach((item) => { item.hidden = value !== 'all' && item.dataset.category !== value; });
        }));

        const viewer = $('#viewer');
        const viewerImage = $('img', viewer);
        const viewerCaption = $('.viewer-caption', viewer);
        let current = 0;
        const visible = () => items.filter((item) => !item.hidden);
        const show = (index) => {
            const list = visible();
            current = (index + list.length) % list.length;
            const button = $('button', list[current]);
            viewerImage.src = button.dataset.full;
            viewerImage.alt = $('img', button).alt;
            viewerCaption.textContent = `${$('figcaption', list[current]).textContent} · ${current + 1} sur ${list.length}`;
        };
        items.forEach((item) => $('button', item).addEventListener('click', () => {
            show(visible().indexOf(item));
            viewer.showModal();
        }));
        $('.viewer-prev', viewer).addEventListener('click', () => show(current - 1));
        $('.viewer-next', viewer).addEventListener('click', () => show(current + 1));
        $('.viewer-close', viewer).addEventListener('click', () => viewer.close());
        viewer.addEventListener('click', (event) => { if (event.target === viewer) viewer.close(); });
        viewer.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowRight') show(current + 1);
            if (event.key === 'ArrowLeft') show(current - 1);
        });
    }

    /* ---------- Formulaire de contact : la commande part sur WhatsApp ---------- */
    const form = $('#order-form');
    if (form) {
        const showError = (field, message) => {
            const input = form.elements[field];
            const box = $(`#${field}-error`);
            input.setAttribute('aria-invalid', message ? 'true' : 'false');
            box.textContent = message || '';
            box.hidden = !message;
        };
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const v = Object.fromEntries(new FormData(form));
            const errors = {
                name: v.name.trim() ? '' : 'Indiquez votre nom.',
                phone: v.phone.replace(/\D/g, '').length >= 8 ? '' : 'Indiquez un numéro valide (8 chiffres au moins).',
                product: v.product ? '' : 'Choisissez ce qui vous intéresse.',
            };
            Object.entries(errors).forEach(([field, message]) => showError(field, message));
            const first = Object.keys(errors).find((field) => errors[field]);
            if (first) { form.elements[first].focus(); return; }
            const lines = [
                'Bonjour Max Avic,',
                `Je suis ${v.name.trim()} (${v.phone.trim()}).`,
                `Je suis intéressé(e) par : ${v.product}${v.quantity ? `, quantité : ${v.quantity}` : ''}.`,
                v.city.trim() ? `Ville de livraison : ${v.city.trim()}.` : '',
                v.message.trim() ? `Message : ${v.message.trim()}` : '',
            ].filter(Boolean);
            window.open(`https://wa.me/${form.dataset.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
            $('#form-sent').hidden = false;
            $('#form-sent').focus();
        });
    }

    /* ---------- Année du pied de page ---------- */
    $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
