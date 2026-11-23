'use strict';
document.addEventListener('DOMContentLoaded', () => {

    /* ---- CONFIG: the one place to edit settings ---- */
    const CONFIG = {
        // Create a free form at formspree.io and paste its URL here, e.g. 'https://formspree.io/f/abcdwxyz'.
        // Leave empty to run in demo mode (nothing is sent).
        formEndpoint: '',
        minFillMs: 3000,       // submissions faster than this are treated as bots
        cooldownMs: 30000,     // minimum gap between submissions per browser
        timeoutMs: 10000
    };

    /* ---- 1. Greeting ---- */
    const h = new Date().getHours();
    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) {
        const part = h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening';
        heroTitle.textContent = `Good ${part}! Welcome to Forest Academy`;
    }
    const yr = document.getElementById('year');
    if (yr) yr.textContent = new Date().getFullYear();

    /* ---- 2. Smooth scroll ---- */
    const nav = document.querySelector('nav');
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', e => {
            const href = link.getAttribute('href');
            if (href === '#') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
            const target = href.startsWith('#') ? document.getElementById(href.slice(1)) : null;
            if (target) {
                e.preventDefault();
                window.scrollTo({ top: target.offsetTop - nav.offsetHeight, behavior: 'smooth' });
            }
        });
    });

    /* ---- 3. Modal (accessible, closes on Esc / outside click) ---- */
    const modal = document.getElementById('applyModal');
    const openBtn = document.getElementById('openModal');
    const closeBtn = modal.querySelector('.close-btn');
    let lastFocus = null;
    const openModal = e => { e.preventDefault(); lastFocus = document.activeElement; modal.style.display = 'block'; modal.querySelector('input').focus(); };
    const closeModal = () => { modal.style.display = 'none'; if (lastFocus) lastFocus.focus(); };
    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.style.display === 'block') closeModal(); });

    /* ---- 4. Secure form handling ---- */
    // Strip control characters and angle brackets, collapse whitespace, cap length.
    const clean = (v, max) => String(v).replace(/[\u0000-\u001F\u007F<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
    const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const rules = {
        name: v => v.length >= 2, parentName: v => v.length >= 2, studentName: v => v.length >= 2,
        email: v => EMAIL.test(v), message: v => v.length >= 5, nationality: v => v.length >= 2,
        grade: v => ['early', 'primary', 'secondary'].includes(v),
        gender: v => ['Male', 'Female'].includes(v),
        dob: v => { const d = new Date(v); const now = new Date(); return !isNaN(d) && d < now && d.getFullYear() > now.getFullYear() - 25; }
    };

    document.querySelectorAll('form[data-form]').forEach(form => {
        const status = form.querySelector('.form-status');
        const btn = form.querySelector('.submit-btn');
        const loadedAt = Date.now();
        const lastKey = 'fa_last_' + form.dataset.form;
        const say = (msg, type) => { status.textContent = msg; status.className = 'form-status ' + type; };

        form.addEventListener('submit', async e => {
            e.preventDefault();
            form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

            // Bot checks: honeypot filled, or submitted unrealistically fast. Pretend success.
            if (form.elements.website.value || Date.now() - loadedAt < CONFIG.minFillMs) {
                say('Thank you! We will be in touch.', 'ok'); form.reset(); return;
            }
            // Client-side cooldown (convenience only; real rate limiting must happen on the server/service).
            let last = 0; try { last = Number(localStorage.getItem(lastKey)) || 0; } catch (_) {}
            if (Date.now() - last < CONFIG.cooldownMs) { say('Please wait a moment before sending again.', 'error'); return; }

            // Validate + sanitize only known fields.
            const data = {}; let bad = null;
            [...form.elements].forEach(el => {
                if (!el.name || el.name === 'website' || el.type === 'submit') return;
                const val = clean(el.value, el.tagName === 'TEXTAREA' ? 1000 : 120);
                data[el.name] = val;
                if (rules[el.name] && !rules[el.name](val)) { el.classList.add('invalid'); bad = bad || el; }
            });
            if (bad) { say('Please check the highlighted fields.', 'error'); bad.focus(); return; }

            btn.disabled = true; say('Sending…', 'ok');
            try {
                if (CONFIG.formEndpoint) {
                    const ctrl = new AbortController();
                    const t = setTimeout(() => ctrl.abort(), CONFIG.timeoutMs);
                    const res = await fetch(CONFIG.formEndpoint, {
                        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({ form: form.dataset.form, ...data }), signal: ctrl.signal, credentials: 'omit'
                    });
                    clearTimeout(t);
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                } else {
                    console.warn('Demo mode: set CONFIG.formEndpoint in script.js to actually receive messages.');
                }
                try { localStorage.setItem(lastKey, String(Date.now())); } catch (_) {}
                say('Thank you! Your message has been sent to Forest Academy.', 'ok');
                form.reset();
                if (form.dataset.form === 'apply') setTimeout(closeModal, 1800);
            } catch (err) {
                say('Sorry, something went wrong. Please call us on +260 976834123.', 'error');
            } finally { btn.disabled = false; }
        });
    });

    /* ---- 5. Scroll reveal (unchanged behaviour) ---- */
    const cards = document.querySelectorAll('.card, .step-card');
    const reveal = () => cards.forEach(c => {
        if (c.getBoundingClientRect().top < window.innerHeight * 0.8) { c.style.opacity = '1'; c.style.transform = 'translateY(0)'; }
    });
    cards.forEach(c => { c.style.opacity = '0'; c.style.transform = 'translateY(20px)'; c.style.transition = 'all 0.6s ease-out'; });
    window.addEventListener('scroll', reveal, { passive: true });
    reveal();
});
